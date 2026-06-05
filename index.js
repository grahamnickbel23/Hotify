import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import connectDB from './connectDB.js';
import loadPublicKey from './publicKey.js';
import song from './src/route/song route.js'
import playlist from './src/route/playlist route.js';
import streaming from './src/route/stream route.js';
import search from './src/route/searh route.js';

const app = express();

const PORT = process.env.PORT;

// basic middelewere
app.use(express.json());
app.use(cookieParser());
app.use(cors()); 

// connect database
connectDB();

// load public key
loadPublicKey();

// baisc route
app.get("/home", (req, res) => {
    return res.status(200).json({
        success: true,
        message: `OK gotta build this now`
    })
})

// get the main routes
app.use("/song", song);
app.use("/playlist", playlist);
app.use("/streaming", streaming);
app.use("/search", search);

app.listen(PORT, () => {
    console.log(`server is running at PORT: ${PORT}`);
})