import fs from "fs";
import path from "path";
import songModel from "../../model/song Model.js";
import playStateModel from "../../model/playState Model.js";
import streamHistoryModel from "../../model/streamHistory Model.js";

export default class stream {

    // send back manifest file
    static async manifest(req, res) {

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

        // get the *.mpd file return error if not found
        const songFolder = song.url.split("/")[2];
        const manifestPath = path.join(process.cwd(), "media", songFolder, "manifest.mpd");

        if (!fs.existsSync(manifestPath)) return res.status(404).json({ success: false, message: "manifest not found" });

        // record streaming history
        await streamHistoryModel.create({
            user: req.accessToken.userId,
            song: song._id
        });

        // return if we got the file
        res.setHeader(
            "Content-Type",
            "application/dash+xml"
        );

        return res.status(200).sendFile(manifestPath);
    }

    // send back audio segment
    static async segment(req, res) {

        const { songId, fileName } = req.params;
        if (!songId || !fileName) return res.status(400).json({ success: false, message: `missing information` });

        // find the song
        const song = await songModel.findById(songId);
        if (!song) return res.status(404).json({ success: false, message: "song not found" });

        // find the segments
        const songFolder = song.url.split("/")[2];
        const filePath = path.join(process.cwd(), "media", songFolder, fileName);

        // return error if an segment is not found
        if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: "segment not found" });

        console.log(`Api is called: ${fileName}`);

        // return files
        return res.status(200).sendFile(filePath);
    }

    // update playback progress
    static async progress(req, res) {

        // get the incoming data and rturn error for missing data
        const { songId, currentPosition, duration } = req.body;
        if ( !songId || currentPosition === undefined || duration === undefined )  return res.status(400).json({ success: false, message: "missing requred information" });

        // return error after normalization if any
        const position = Number(currentPosition);
        const songDuration = Number(duration);
        if ( Number.isNaN(position) || Number.isNaN(songDuration)) return res.status(400).json({ success: false, message: "invalid position or duration" });
    

        // save the data into mongo db after normalization
        const completed = position >= songDuration * 0.95;
        const playbackState = await playStateModel.findOneAndUpdate({ user: req.accessToken.userId, song: songId },
                {
                    $set: { lastPosition: position, duration: songDuration, lastPlayedAt: new Date(), completed },
                    $max: { maxPositionReached: position }
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

        // if all ok return ok
        return res.status(200).json({
            success: true,
            message: "playback progress updated",
            record: playbackState
        });
    }
}