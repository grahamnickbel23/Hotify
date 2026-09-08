import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import connectDB from './connectDB.js';
import loadPublicKey from './publicKey.js';
import song from './src/route/song route.js'
import playlist from './src/route/playlist route.js';
import streaming from './src/route/stream route.js';
import serverStream from './src/route/serverStream route.js'
import serverPlayerWSRoute from './src/route/serverStresWS route.js';
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
app.use("/server/streaming", serverStream);
app.use("/search", search);

// http server
const server = http.createServer(app);

// WebSocket server
const wss = new WebSocketServer({
    server,
    path: "/ws/server-player"
});

// initilize wss
serverPlayerWSRoute(wss);

server.listen(PORT, () => {
    console.log(`server is running at PORT: ${PORT}`);
});