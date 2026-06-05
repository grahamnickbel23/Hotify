import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "userModel",
        required: true
    },

    songs: [{
        songId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "songModel",
            required: true
        },

        added: {
            type: Date,
            default: Date.now
        }
    }]

}, {
    timestamps: true
});

export default mongoose.model( "playlistModel", playlistSchema );