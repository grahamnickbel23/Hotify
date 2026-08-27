import fs from "fs";
import path from "path";
import songModel from "../../model/song Model.js";
import playlistModel from "../../model/playlist Model.js";
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

        // console.log(`Api is called: ${fileName}`);

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

    static async autoPlay(req, res) {

        // get the info
        const { playlistId, songId } = req.body;
        if (!playlistId || !songId) return res.status(400).json({ success: false, message: "missing information" });
        
        // cheak if the playlist exisit
        const playlist = await playlistModel.findById(playlistId).populate("songs.songId");
        if (!playlist) return res.status(404).json({ success: false, message: "playlist not found" });
        
        // find inde of the song
        const index = playlist.songs.findIndex( song => song.songId._id.toString() === songId );
        if (index === -1) return res.status(404).json({ success: false, message: "song not found in playlist" });
        
        // get the id of the next song
        const nextSong = playlist.songs[index + 1];
        if (!nextSong) return res.status(200).json({ success: true, hasNext: false });
        
        // return ok if all ok
        return res.status(200).json({
            success: true,
            hasNext: true,
            song: nextSong.songId
        });
    }

    // get stream history
    static async history(req, res) {

    let { length, page } = req.body;

    length = Number(length) || 7;
    page = Number(page) || 1;

    const historyInfo = await streamHistoryModel
        .find({ user: req.accessToken.userId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * length)
        .limit(length)
        .populate({
            path: "song",
            select: "title firstSinger"
        });

    if (historyInfo.length === 0) {
        return res.status(200).json({
            success: true,
            message: "No listening history found",
            result: []
        });
    }

    return res.status(200).json({
        success: true,
        message: "Successfully fetched user history",
        result: historyInfo
    });
}
}