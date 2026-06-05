import mongoose from "mongoose";

const userSchema = new mongoose.Schema({

    refreshToken: String,

    email: {
        type: String,
        unique: true,
        requred: true
    },

    password: {
        type: String,
        require: true
    },

    firstName: {
        type: String,
        default: 'Graham'
    },

    middeleName: String,

    lastName: {
        type: String,
        default: 'Nickbel'
    },

    gender: {
        type: String,
        enum: ['male', 'female', 'prefer-not-to-say'],
        default: 'prefer-not-to-say'
    },

    dob: {
        type: Date,
        //require: true
    },

    language: String,

    prefarence: {
        type: String,
        enum: ['bright', 'dark'],
        default: 'dark'
    },

    userType: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    }
}, {
    timestamps: true
});

export default mongoose.model('userModel', userSchema);