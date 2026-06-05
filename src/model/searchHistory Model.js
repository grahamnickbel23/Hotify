import mongoose from "mongoose";

const searchHistory = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: `userModel`
    },

    searchItem: {
        type: String,
        required: true
    },

    result: {
        type: mongoose.Schema.Types.ObjectId,
        ref: `songModel`
    }
}, {
    timestamps: true
});

export default mongoose.model('searchHistoryModel', searchHistory);