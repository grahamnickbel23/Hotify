import mongoose from "mongoose";

const streamHistory = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },

    song: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "songModel",
        required: true
    }

}, {
    timestamps: true
});

export default mongoose.model( "streamHistoryModel", streamHistory );