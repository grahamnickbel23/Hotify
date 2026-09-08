import fs from "fs";
import path from "path";
import net from "net";
import { spawn } from "child_process";
import serverPlayerWS from "./serverWS logic.js";
import userModel from "../../model/user Model.js";
import songModel from "../../model/song Model.js";
import streamHistoryModel from "../../model/streamHistory Model.js";


export default class serverPlayer {

    static mpvProcess = null;
    static mpvSocket = null;

    static commandId = 0;
    static pendingCommands = new Map();

    static socketPath = "/tmp/hotify-mpv.sock";


    // start mpv
    static async start(req, res) {

        // Cheak if mpv is already running
        if (serverPlayer.mpvProcess) return res.status(200).json({ success: true, message: "server player already running" });

        // remove socket from previous crashed process
        if (fs.existsSync(serverPlayer.socketPath)) fs.unlinkSync(serverPlayer.socketPath);

        // set ALSA output avoide pipewire
        serverPlayer.mpvProcess = spawn("mpv", [
            "--idle=yes",
            "--no-video",
            "--ao=alsa",
            "--audio-device=alsa/plughw:1,0",
            `--input-ipc-server=${serverPlayer.socketPath}`
        ], {
            stdio: ["ignore", "pipe", "pipe"]
        });


        serverPlayer.mpvProcess.stdout.on("data", data => {
            console.log(`[mpv] ${data.toString()}`);
        });


        serverPlayer.mpvProcess.stderr.on("data", data => {
            console.error(`[mpv] ${data.toString()}`);
        });


        serverPlayer.mpvProcess.on("exit", (code, signal) => {

            console.log(
                `mpv exited. code=${code}, signal=${signal}`
            );

            serverPlayer.mpvProcess = null;

            if (serverPlayer.mpvSocket) {
                serverPlayer.mpvSocket.destroy();
                serverPlayer.mpvSocket = null;
            }

            // reject all commands waiting for mpv
            for (const [, pending] of serverPlayer.pendingCommands) {
                pending.reject(
                    new Error("mpv process exited")
                );
            }

            serverPlayer.pendingCommands.clear();
        });


        // Wait until mpv creates its IPC socket
        await serverPlayer.waitForSocket();

        // Connect Node -> mpv IPC
        await serverPlayer.connectIPC();


        // Tell mpv which properties we want updates for
        await serverPlayer.observeProperty(1, "time-pos");
        await serverPlayer.observeProperty(2, "duration");
        await serverPlayer.observeProperty(3, "pause");
        await serverPlayer.observeProperty(4, "path");
        await serverPlayer.observeProperty(5, "volume");

        // update db
        await userModel.findByIdAndUpdate(
            req.accessToken.userId,
            { $set : {audioOut: 'server'}}
        )

        // return ok if all ok
        return res.status(200).json({
            success: true,
            message: "server player started"
        });

    }


    // stop mpv
    static async stop(req, res) {

        // cheak if mpv is there or not
        if (!serverPlayer.mpvProcess) return res.status(200).json({ success: true, message: "server player is not running" });

        // Quit mpv
        await serverPlayer.command("quit");

        // update db
        await userModel.findByIdAndUpdate(
            req.accessToken.userId,
            { $set : {audioOut: 'device'}}
        )

        // return ok if all ok
        return res.status(200).json({ success: true, message: "server player stopped" });
    }


    // play song
    static async play(req, res) {

        // get the song and search the song
        const { songId, songName } = req.params;

        // get the song if not return error
        let song = null;
        if (songId) {
            song = await songModel.findById(songId);
        } else {
            song = await songModel.findOne({ title: songName });
        }
        if (!song) return res.status(404).json({ success: false, message: "song not found" });


        // Make sure mpv exists
        if (!serverPlayer.mpvProcess) return res.status(400).json({ success: false, message: "server player is not running" });

        // get the mpd file or return error
        const songFolder = song.url.split("/")[2];
        const manifestPath = path.join(process.cwd(), "media", songFolder, "manifest.mpd");
        if (!fs.existsSync(manifestPath)) return res.status(404).json({ success: false, message: "manifest not found" });

        // record streaming history
        await streamHistoryModel.create({
            user: req.accessToken.userId,
            song: song._id
        });

        // start playing song
        await serverPlayer.command("loadfile", manifestPath, "replace");

        // return ok if all ok
        return res.status(200).json({ success: true, message: "song started" });
    }


    // control
    static async control(req, res) {

        // get the user input
        const { action, value } = req.body;
        if (!action) return res.status(400).json({ success: false, message: "action is required" });

        // cheak if mpv is running
        if (!serverPlayer.mpvProcess) return res.status(400).json({ success: false, message: "server player is not running" });

        switch (action) {

            case "pause":

                await serverPlayer.command(
                    "set_property",
                    "pause",
                    true
                );

                break;


            case "resume":

                await serverPlayer.command(
                    "set_property",
                    "pause",
                    false
                );

                break;


            case "seek":

                if (value === undefined) {
                    return res.status(400).json({
                        success: false,
                        message: "seek position is required"
                    });
                }

                await serverPlayer.command(
                    "seek",
                    Number(value),
                    "absolute"
                );

                break;


            case "stop":

                await serverPlayer.command(
                    "stop"
                );

                break;


            case "volume":

                if (value === undefined) {
                    return res.status(400).json({
                        success: false,
                        message: "volume is required"
                    });
                }

                await serverPlayer.command(
                    "set_property",
                    "volume",
                    Number(value)
                );

                break;


            default:

                return res.status(400).json({
                    success: false,
                    message: `unknown action: ${action}`
                });
        }

        // return ok if all ok
        return res.status(200).json({
            success: true,
            message: `${action} command executed`
        });

    }

    // current state
    static async state(req, res) {

        if (!serverPlayer.mpvProcess) return res.status(200).json({ success: true, message: "server player is not running" });


        const timePos = await serverPlayer.command(
            "get_property",
            "time-pos"
        );

        const duration = await serverPlayer.command(
            "get_property",
            "duration"
        );

        const paused = await serverPlayer.command(
            "get_property",
            "pause"
        );

        const currentPath = await serverPlayer.command(
            "get_property",
            "path"
        );


        // return ok if all ok
        return res.status(200).json({
            success: true,
            running: true,

            state: {
                position: timePos,
                duration: duration,
                paused: paused,
                path: currentPath
            }
        });

    }


    // connect to mpv ipc
    static connectIPC() {

        return new Promise((resolve, reject) => {

            const socket = net.createConnection(
                serverPlayer.socketPath
            );

            serverPlayer.mpvSocket = socket;


            let buffer = "";


            socket.on("connect", () => {

                console.log("Connected to mpv IPC");

                resolve();
            });


            socket.on("data", data => {

                buffer += data.toString();

                const lines = buffer.split("\n");

                buffer = lines.pop();


                for (const line of lines) {

                    if (!line.trim()) continue;

                    try {

                        const message = JSON.parse(line);

                        serverPlayer.handleMPVMessage(
                            message
                        );

                    } catch (error) {

                        console.error(
                            "Invalid mpv IPC message:",
                            line
                        );
                    }
                }
            });


            socket.on("error", error => {

                console.error(
                    "mpv IPC error:",
                    error
                );

                reject(error);
            });


            socket.on("close", () => {

                console.log("mpv IPC connection closed");

                serverPlayer.mpvSocket = null;
            });
        });
    }


    // handel mpv event
    static handleMPVMessage(message) {

        if (message.request_id !== undefined) {

            const pending =
                serverPlayer.pendingCommands.get(
                    message.request_id
                );

            if (!pending) return;

            serverPlayer.pendingCommands.delete(
                message.request_id
            );

            if (message.error !== "success") {

                pending.reject(
                    new Error(message.error)
                );

            } else {

                pending.resolve(message.data);
            }

            return;
        }


        if (message.event === "property-change") {

            serverPlayerWS.broadcast({
                type: "player-update",
                property: message.name,
                value: message.data
            });

            return;
        }


        if (message.event === "file-loaded") {

            serverPlayerWS.broadcast({
                type: "song-loaded"
            });

            return;
        }


        if (message.event === "end-file") {

            serverPlayerWS.broadcast({
                type: "song-ended",
                reason: message.reason
            });

            return;
        }
    }


    // send comand to mpv
    static command(command, ...args) {

        return new Promise((resolve, reject) => {

            if (!serverPlayer.mpvSocket) {

                reject(
                    new Error("mpv IPC is not connected")
                );

                return;
            }


            const requestId =
                ++serverPlayer.commandId;


            const message = {
                command: [
                    command,
                    ...args
                ],
                request_id: requestId
            };


            serverPlayer.pendingCommands.set(
                requestId,
                {
                    resolve,
                    reject
                }
            );


            serverPlayer.mpvSocket.write(
                JSON.stringify(message) + "\n"
            );
        });
    }


    // observ mpv property
    static async observeProperty(id, property) {

        return serverPlayer.command(
            "observe_property",
            id,
            property
        );
    }


    // wait for mpv socket
    static async waitForSocket(timeout = 5000) {

        const start = Date.now();

        while (!fs.existsSync(serverPlayer.socketPath)) {

            if (Date.now() - start > timeout) {

                throw new Error(
                    "Timed out waiting for mpv IPC socket"
                );
            }

            await new Promise(
                resolve => setTimeout(resolve, 50)
            );
        }
    }
}