import expess from "express";
import genPerser from '../middleware/genJwtPerser secure.js';
import { asyncHandler } from '../utils/asyncHandeller utils.js';
import playlist from '../controller/streaming/playlist logic.js';

const route = expess.Router();

// create playlist
route.post("/create", 
    genPerser('access_token', 'accessToken'),
    asyncHandler(playlist.create, "creating new playlist"));

// create mobile playlist
route.post("/mob/create", 
    (req, res, next) => {req.format = 'token', next()}, 
    genPerser('access_token', 'accessToken'),
    asyncHandler(playlist.create, "creating new playlist"));

// read all playlist
route.get("/read",
    genPerser('access_token', 'accessToken'),
    asyncHandler(playlist.allRead, "reading all playlist"));

// read all playlist mobile
route.get("/mob/read",
    (req, res, next) => {req.format = 'token', next()},
    genPerser('access_token', 'accessToken'),
    asyncHandler(playlist.allRead, "reading all playlist"));

// read a spcific playlist
route.get("/:id/read",
    genPerser('access_token', 'accessToken'),
    asyncHandler(playlist.oneRead, "reading a playlist"));

// read a spcific playlist
route.get("/mob/:id/read",
    (req, res, next) => {req.format = 'token', next()},
    genPerser('access_token', 'accessToken'),
    asyncHandler(playlist.oneRead, "reading a playlist"));

// add songs
route.post("/add/song", 
    genPerser('access_token', 'accessToken'),
    asyncHandler(playlist.updateSong, "updating new song"));

// add song from mobile
route.post("/mob/add/song", 
    (req, res, next) => {req.format = 'token', next()}, 
    genPerser('access_token', 'accessToken'),
    asyncHandler(playlist.updateSong, "updating new song"));

// delete songs
route.post("/delete/song",
    genPerser('access_token', 'accessToken'),
    asyncHandler(playlist.deleteSong, "deleting song from playlist"));

// delete mobile songs
route.post("/mob/delete/song",
    (req, res, next) => {req.format = 'token', next()}, 
    genPerser('access_token', 'accessToken'),
    asyncHandler(playlist.deleteSong, "deleting song from playlist"));

// rename playlist
route.post("/rename", 
    genPerser('access_token', 'accessToken'),
    asyncHandler(playlist.rename, "renaming playlisy"));

// rename mobile playlist
route.post("/mob/rename", 
    (req, res, next) => {req.format = 'token', next()}, 
    genPerser('access_token', 'accessToken'),
    asyncHandler(playlist.rename, "renaming playlist"));

// delete playlist
route.post("/delete",
    genPerser('access_token', 'accessToken'),
    asyncHandler(playlist.deletePlaylist, "deleting playlist"));

// mobile delete playlist
route.post("/mob/delete",
    (req, res, next) => {req.format = 'token', next()}, 
    genPerser('access_token', 'accessToken'),
    asyncHandler(playlist.deletePlaylist, "deleting playlist"));

export default route;