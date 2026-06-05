import mongoose from "mongoose";

export default async function connectDB () {
    try{

        await mongoose.connect(process.env.MONGO_URL);
        console.log(`MongoDB connected`);

    } catch (err) {

        console.log(`MongoDB Connection error: ${err}`);
        
    }
}