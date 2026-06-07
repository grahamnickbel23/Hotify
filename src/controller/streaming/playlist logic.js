import playlistModel from "../../model/playlist Model.js";
import playlistApi from "../../services/playlist Service.js";

export default class playlist {

    // create playlist
    static async create(req, res) {

        // get the info 
        const { name } = req.body;
        if (!name) return res.status(400).json({ success: false, message: "playlist name missing" });

        // cheak if any same name playlist exisit
        const doesPlaylistExisit = await playlistModel.findOne({ name });
        if (doesPlaylistExisit) return res.status(400).json({ success: false, message: `the playlist already exisit` });

        // if all ok create a new playlist
        const playlist = await playlistModel.create({ userId: req.accessToken.userId, name });

        // send email for playlist creation
        await playlistApi.email(req.accessToken.userId, name);

        // if all ok return ok
        return res.status(201).json({
            success: true,
            message: "playlist created successfully",
            playlist
        });
    }

    // read all playlists
    static async allRead(req, res) {

        const playlists = await playlistModel.find({ userId: req.accessToken.userId })
            .sort({ updatedAt: -1 });

        return res.status(200).json({
            success: true,
            message: "playlists fetched successfully",
            playlists
        });
    }

    // read a playlist
    static async oneRead (req, res) {

        // get the data
        const { playlistId } = req.body;

        const allSong = await playlistModel.findById(playlistId).populate("songs.songId").sort({ updatedAt: -1 });
        if (!allSong) return res.status(404).json({ success: false, message: `no playlist found` });

        // if all ok send them
        return res.status(200).json({
            success: true,
            message: "playlists fetched successfully",
            playlist: allSong
        });
    }

    // add song to playlist
    static async updateSong(req, res) {

        // get the info and return error if needed
        const { playlistId, songId } = req.body;
        if (!playlistId || !songId) return res.status(400).json({ success: false, message: "missing information" });

        // cheak if the paylist exisit
        const doesPlaylistExisit = await playlistModel.findOne({ _id: playlistId, userId: req.accessToken.userId });
        if (!doesPlaylistExisit) return res.status(404).json({ success: false, message: "playlist not found" });


        // cheak if the song already exisit
        const alreadyExists = doesPlaylistExisit.songs.some(song => song.songId.toString() === songId);
        if (alreadyExists) return res.status(409).json({ success: false, message: "song already exists in playlist" });


        // if all ok add the song
        doesPlaylistExisit.songs.push({ songId });
        await doesPlaylistExisit.save();

        // return ok if all ok
        return res.status(200).json({
            success: true,
            message: "song added successfully"
        });
    }

    // remove song from playlist
    static async deleteSong(req, res) {

        // get the info
        const { playlistId, songId } = req.body;
        if (!playlistId || !songId) return res.status(400).json({ success: false, message: "missing information" });

        // cheak if the playlisi exist
        const doesPlaylistExisit = await playlistModel.findOne({ _id: playlistId, userId: req.accessToken.userId });
        if (!doesPlaylistExisit) return res.status(404).json({ success: false, message: "playlist not found" });

        // if all ok delete song
        doesPlaylistExisit.songs = doesPlaylistExisit.songs.filter(song => song.songId.toString() !== songId);
        await doesPlaylistExisit.save();

        // if all ok return ok
        return res.status(200).json({
            success: true,
            message: "song removed successfully"
        });
    }

    // rename playlist
    static async rename(req, res) {

        // get the data
        const { playlistId, name } = req.body;
        if (!playlistId || !name) return res.status(400).json({ success: false, message: "missing information" });
        

        // cheak if the playlist exist
        const playlist = await playlistModel.findOne({ _id: playlistId,  userId: req.accessToken.userId });
        if (!playlist) return res.status(404).json({  success: false, message: "playlist not found" });
        
        // rename it and save
        playlist.name = name;
        playlist.updatedAt = new Date();
        await playlist.save();

        // return ok if all ok
        return res.status(200).json({
            success: true,
            message: "playlist renamed successfully",
            playlist
        });
    }

    // delete playlist
    static async deletePlaylist(req, res) {

        // get the data
        const { playlistId } = req.body;
        if (!playlistId) return res.status(400).json({ success: false, message: "playlist id missing" });
        
        // cheak if the play list exist
        const playlist = await playlistModel.findOneAndDelete({ _id: playlistId, userId: req.accessToken.userId });
        if (!playlist) return res.status(404).json({ success: false, message: "playlist not found" });
        
        // return ok if all ok
        return res.status(200).json({
            success: true,
            message: "playlist deleted successfully"
        });
    }

}