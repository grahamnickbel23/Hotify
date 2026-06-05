import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cookieParser from 'cookie-parser';
import connectDB from './connectDB.js';
import { connectRedis } from './connectRedis.js';

import authRoute from './src/route/auth route.js'

const app = express();

const port = process.env.PORT;

// basic middelewere
app.use(express.json());
app.use(cookieParser());

// connect db
connectDB();
connectRedis();

// test route
app.get("/home", (req, res) => {
    return res.status(200).json({
        success: true,
        message: `gotta build microservices now`
    })
})

// main apis
app.use("/auth", authRoute);

// app listen
app.listen(port, () => {
    console.log(`auth server is running at PORT: ${port}`);
})