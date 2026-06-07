import fs from "fs";
import path from "path";
import { exec } from "child_process";
import songModel from "../../model/song Model.js";
import lyricsModel from "../../model/lyrics Model.js";
import songApi from "../../services/song Service.js";

export default class song {

    // upload song
    static async create(req, res) {

        // get the data
        const data = req.body;
        const file = req.file;

        // error habdeling
        if (!file) return res.status(400).json({ success: false, message: "audio file missing" });
        if (!data.title || !data.firstSinger) return res.status(400).json({ success: false, message: "incomplete metadata" });

        // get the song name
        const mediaFolder = path.join(process.cwd(), "media", data.title);

        // create media folder and set paths
        fs.mkdirSync(mediaFolder, { recursive: true });
        const inputPath = path.join(process.cwd(), file.path);
        const manifestPath = path.join(mediaFolder, "manifest.mpd");

        //DASH + Opus encoding
        await songApi.processAudio(inputPath, manifestPath);

        // get the admin id and url
        data.uploadedBy = req.accessToken.userId;
        data.url = `/media/${data.title}/manifest.mpd`;

        // save the new info into db
        const newSong = songModel(data);
        const savedSong = await newSong.save();

        // delete the song from upload folder
        fs.unlinkSync(inputPath);

        // save the lyrics
        await songApi.lyricsUpload(data.title, savedSong._id);

        // send a email for song upload too
        await songApi.emailUpload(req.accessToken.userId, data);

        return res.status(201).json({
            success: true,
            message: "song uploaded successfully"
        });
    }

    // update song meta data
    static async update(req, res) {

        // get the info
        const { songId, fieldName, info } = req.body;
        if (!songId || !fieldName || !info) return res.status(400).json({ success: false, message: "missing requred info" });

        // find song data and return error if preset
        let song = await songModel.findById(songId);
        if (!song) return res.status(404).json({ success: false, message: "song not found" });

        // list of fields where chnages is alllowed
        const allowedFields = [

            "title",
            "firstSinger",
            "secondSinger",
            "otherSinger",

            "composer",
            "musicLabel",
            "movieName",

            "actor",

            "sourceUrl",
            "uploadedAudioFormat",

            "length",

            "language",
            "originCountry"
        ];

        // cheak if the info belongs to the allowd field
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) song[field] = req.body[field];
        });

        // save the info
        const updatedInfo = { [fieldName]: info };
        song = await songModel.findByIdAndUpdate(songId, updatedInfo, { new: true });

        // return ok if all ok
        return res.status(200).json({
            success: true,
            message: "song updated successfully",
            newInfo: song
        });
    }

    // read song info
    static async read(req, res) {

        // get the info
        const { songId } = req.body;
        if (!songId) return res.status(400).json({ success: false, message: "song id missing" });

        // cheak if the song exisit
        const song = await songModel.findById(songId);
        if (!song) return res.status(404).json({ success: false, message: "song not found" });

        // search lyrics 
        const lyrics = await lyricsModel.findOne({songId});
        
        // return ok if all ok
        return res.status(200).json({
            success: true,
            message: "song fetched successfully",
            songInfo: song,
            lyricsInfo: lyrics
        });
    }

    // list all songs
    static async listAll(req, res) {

        // get the songs
        const songs = await songModel.find().sort({ createdAt: -1 });

        // return ok if all ok
        return res.status(200).json({
            success: true,
            message: "songs fetched successfully",
            count: songs.length,
            data: songs
        });
    }

    // list songs uploaded by current admin
    static async listAdmin(req, res) {

        // get the songs
        const songs = await songModel.find({ uploadedBy: req.accessToken.userId }).sort({ createdAt: -1 });

        // return ok if all ok
        return res.status(200).json({
            success: true,
            message: "admin songs fetched successfully",
            count: songs.length,
            info: songs
        });
    }

    // delete song
    static async delete(req, res) {

        // get the all the information
        const { songId } = req.body;
        if (!songId) return res.status(400).json({ success: false, message: "song id missing" });

        // cheak if the song exisit
        const song = await songModel.findById(songId);
        if (!song) return res.status(404).json({ success: false, message: "song not found" });

        // delete lyrics
        await lyricsModel.deleteOne({ songId: song._id});

        // deelte the folder physically
        const mediaFolder = path.join(process.cwd(), "media", song.title);
        if (fs.existsSync(mediaFolder)) { fs.rmSync(mediaFolder, { recursive: true, force: true }) }

        // delete the db record
        await song.deleteOne();

        // return ok if all ok
        return res.status(200).json({
            success: true,
            message: "song deleted successfully"
        });
    }
}