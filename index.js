import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import emailSent from './src/routes/email router.js';

const app = express();
const port = process.env.PORT;

// basic middelewere
app.use(express.json());

// test route
app.get("/home", (req, res) => {
    return res.status(200).json({
        success: true,
        message: `notification service is wroking`
    })
});

// main notification route
app.use("/email", emailSent);

// server start
app.listen(port, () => {
    console.log(`server is running at PORT:${port}`);
})