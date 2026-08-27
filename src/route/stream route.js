import express from "express";
import genPerser from "../middleware/genJwtPerser secure.js";
import { asyncHandler } from "../utils/asyncHandeller utils.js";
import stream from "../controller/streaming/stream logic.js";

const route = express.Router();

// send manifest.mpd file
route.get("/:songId/manifest.mpd", 
    genPerser('access_token', 'accessToken'),
    asyncHandler(stream.manifest, "sending manifest file"));

// send manifest.mpd file mobile
route.get("/mob/:songId/manifest.mpd", 
    (req, res, next) => {req.format = 'token', next()}, 
    genPerser('access_token', 'accessToken'),
    asyncHandler(stream.manifest, "sending manifest file"));

// send audio segment
route.get("/:songId/:fileName", 
    genPerser('access_token', 'accessToken'),
    asyncHandler(stream.segment, "sending audio segment file"));

// send audio segment mobile
route.get("/mob/:songId/:fileName", 
    (req, res, next) => {req.format = 'token', next()}, 
    genPerser('access_token', 'accessToken'),
    asyncHandler(stream.segment, "sending audio segment file"));

// update pogress
route.post("/pogress", genPerser('access_token', 'accessToken'), 
    asyncHandler(stream.progress, "updating playback progress"));

// mobile update pogress
route.post("/mob/pogress",
    (req, res, next) => {req.format = 'token', next()}, 
    genPerser('access_token', 'accessToken'),
    asyncHandler(stream.progress, "updating playback progress"));

// auto play
route.get("/autoplay",
    genPerser('access_token', 'accessToken'),
    asyncHandler(stream.autoPlay, "getting auto play suggestion"));

route.get("/mob/autoplay",
    (req, res, next) => {req.format = 'token', next()}, 
    genPerser('access_token', 'accessToken'),
    asyncHandler(stream.autoPlay, "getting auto play suggestion"));

// stream history
route.post("/history", 
    genPerser('access_token', 'accessToken'),
    asyncHandler(stream.history, "getting streaming history"));

route.get("/mob/history",
    (req, res, next) => {req.format = 'token', next()}, 
    genPerser('access_token', 'accessToken'),
     asyncHandler(stream.history, "getting streaming history"));

export default route;
