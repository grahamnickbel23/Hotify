import mongoose from "mongoose";

const playbackState = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },

    song: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "songModel",
        required: true
    },

    lastPosition: {
        type: Number,
        default: 0
    },

    maxPositionReached: {
        type: Number,
        default: 0
    },

    duration: {
        type: Number,
        default: 0
    },

    completed: {
        type: Boolean,
        default: false
    },

    playCount: {
        type: Number,
        default: 0
    },

    lastPlayedAt: {
        type: Date,
        default: Date.now
    }

}, {
    timestamps: true
});

playbackState.index(
    {
        user: 1,
        song: 1
    },
    {
        unique: true
    }
);

export default mongoose.model( "playbackStateModel", playbackState );