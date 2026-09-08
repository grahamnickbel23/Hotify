import express from "express";
import genPerser from "../middleware/genJwtPerser secure.js";
import adminAuth from "../middleware/ admin Secure.js";
import { asyncHandler } from "../utils/asyncHandeller utils.js";
import serverPlayer from "../controller/streaming/serverStream logic.js";

const route = express.Router();

// start mpv
route.post("/start",
    genPerser('access_token', 'accessToken'), adminAuth,
    asyncHandler(serverPlayer.start, "starting server player"));

// start mpv for mobile
route.post("/mob/start",
    (req, res, next) => {req.format = 'token', next()}, 
    genPerser('access_token', 'accessToken'), adminAuth,
    asyncHandler(serverPlayer.start, "starting server player"));

// stop mpv
route.post("/stop",
    genPerser('access_token', 'accessToken'), adminAuth,
    asyncHandler(serverPlayer.stop, "stopping server player"));

// stop mpv mobile
route.post("/mob/stop",
    (req, res, next) => {req.format = 'token', next()}, 
    genPerser('access_token', 'accessToken'), adminAuth,
    asyncHandler(serverPlayer.stop, "stopping server player"));


// play song
route.post("/play/:songId",
    genPerser('access_token', 'accessToken'), adminAuth,
    asyncHandler(serverPlayer.play, "playing song on server player"));

// play song for mobile
route.post("/mob/play/:songId",
    (req, res, next) => {req.format = 'token', next()}, 
    genPerser('access_token', 'accessToken'), adminAuth,
    asyncHandler(serverPlayer.play, "playing song on server player"));


// control server player
route.post("/control",
    genPerser('access_token', 'accessToken'), adminAuth,
    asyncHandler(serverPlayer.control, "controlling server player"));

// control server player for mobile
route.post("/mob/control",
    (req, res, next) => {req.format = 'token', next()}, 
    genPerser('access_token', 'accessToken'), adminAuth, 
    asyncHandler(serverPlayer.control, "controlling server player"));


// get current player state
route.get("/state",
    genPerser('access_token', 'accessToken'), adminAuth, 
    asyncHandler(serverPlayer.state, "getting server player state"));

// get current player state for mobile
route.get("/mob/state",
    (req, res, next) => {req.format = 'token', next()}, 
    genPerser('access_token', 'accessToken'), adminAuth, 
    asyncHandler(serverPlayer.state, "getting server player state"));


export default route;