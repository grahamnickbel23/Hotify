import mongoose from "mongoose";

const songSchema = new mongoose.Schema({

    title: {
        type: String,
        unique: true,
        require: true
    },

    firstSinger :{
        type:String,
        reqire: true
    },

    secondSinger: String,
    otherSinger: [String],

    composer: [String],
    musicLabel: String,
    movieName: String,
    actor:[String],

    url: {
        type: String,
        require: true
    },
    sourceUrl: String,
    uploadedAudioFormat: String,
    length:{
        type: Number,
        min: 0
    },

    language: String,
    originCountry: String,

    uploadedBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: `userModel`
    }
}, {
    timestamps: true
});

songSchema.index({
    title: "text",
    firstSinger: "text",
    secondSinger: "text",
    movieName: "text"
});

export default mongoose.model('songModel', songSchema);