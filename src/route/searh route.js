import express from "express";
import search from "../controller/search/search logic.js";
import genPerser from "../middleware/genJwtPerser secure.js";
import { asyncHandler } from "../utils/asyncHandeller utils.js";

const route = express.Router();

// search queary
route.get("/:query", 
    genPerser('access_token', 'accessToken'),
    asyncHandler(search.song, "genaral search"));

// search history
route.post("/history",
    genPerser('access_token', 'accessToken'),
    asyncHandler(search.history, "saved search result"));

// read search history
route.get("/read/history",
    genPerser('access_token', 'accessToken'),
    asyncHandler(search.readHistory, "read search result"));

export default route;