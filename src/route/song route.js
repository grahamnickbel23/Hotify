import express from "express";
import multer from "multer";
import genPerser from "../middleware/genJwtPerser secure.js";
import adminAuth from "../middleware/ admin Secure.js";
import { asyncHandler } from "../utils/asyncHandeller utils.js";
import song from "../controller/streaming/song logic.js";

const route = express.Router();
const upload = multer({ dest: 'uploads/' })

// upload songs
route.post("/upload", 
    genPerser('access_token', 'accessToken'), adminAuth,
    upload.single("song"), asyncHandler(song.create, "uploading song into hotify"));

// mobile upload songs
route.post("/mob/upload", 
    (req, res, next) => {req.format = 'token', next()}, 
    genPerser('access_token', 'accessToken'), adminAuth,
    upload.single("song"), asyncHandler(song.create, "uploading song into hotify"));

// update song
route.post("/update",
    genPerser('access_token', 'accessToken'), adminAuth,
    asyncHandler(song.update, "updating song information"));

// update song mobile
route.post("/mob/update",
    (req, res, next) => {req.format = 'token', next()}, 
    genPerser('access_token', 'accessToken'), adminAuth,
    asyncHandler(song.update, "updating song information"));

// read song data
route.post("/read",
    genPerser('access_token', 'accessToken'),
    asyncHandler(song.read, "reading song data"));

// read song data mobile
route.post("/mob/read",
    (req, res, next) => {req.format = 'token', next()}, 
    genPerser('access_token', 'accessToken'),
    asyncHandler(song.read, "reading song data"));

// delete song
route.post("/delete",
    genPerser('access_token', 'accessToken'), adminAuth,
    asyncHandler(song.delete, "deleting song"));

// delete song mobile
route.post("/mob/delete",
    (req, res, next) => {req.format = 'token', next()}, 
    genPerser('access_token', 'accessToken'), adminAuth,
    asyncHandler(song.delete, "deleting song"));
    

export default route;


//https://www.punishbang.com/video/15483/casual-mommy-is-enslaved-fucked-and/