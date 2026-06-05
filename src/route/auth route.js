import express from 'express';
import auth from '../controller/auth logic.js';
import adminAuth from '../middelewere/admin secure.js';
import authWeb from '../middelewere/jwtPerser secure.js';
import authMobile from '../middelewere/jwtPerserMob secure.js';
import genPerser from '../middelewere/genJwtPerser secure.js';
import { asyncHandler } from '../utils/asyncHandeller utils.js';

const router = express.Router();

// signup
router.post("/signup", authWeb, adminAuth, asyncHandler(auth.signup, "signup for new user"));

// mobile signup
router.post("/mob/signup", authMobile, adminAuth, asyncHandler(auth.signup, "signup for new user"));

// request login
router.post("/request/login", asyncHandler(auth.requestLogin, "request login into account"));

// mobile request login
router.post("/mob/request/login", 
    (req, res, next) => {req.format = 'token', next()}, 
    asyncHandler(auth.requestLogin, "request login into account"));

// confirm login
router.post("/confirm/login", 
    genPerser('trust_token',  'TRUST_LOGIN_JWT_KEY', 'trustInfo'), 
    asyncHandler(auth.confirmLogin, "confirmed login into account"));

// consirm login
router.post("/mob/confirm/login", 
    (req, res, next) => {req.format = 'token', next()},
    genPerser('trust_token',  'TRUST_LOGIN_JWT_KEY', 'trustInfo'), 
    asyncHandler(auth.confirmLogin, "mobile login into account"));

// logout
router.post("/logout", authWeb, asyncHandler(auth.logout, "loggin out from the account"));

// logout mobile
router.post("/mob/logout", authMobile, asyncHandler(auth.logout, "logging out from account from mobile device"));

// token regranration
router.post("/token", 
    (req, res, next) => {req.exsemtion = true; next()}, 
    authWeb, asyncHandler(auth.tokenIssue, "issuing access_token"));

// token regenration mobile
router.post("/mob/token", 
    (req, res, next) => {req.exsemtion = true; next()}, 
    authMobile, asyncHandler(auth.tokenIssue, "issuing access_token for mobile"));

// public key (privet route)
router.get("/public/key", asyncHandler(auth.publicKey, "sending public key"));

// profile
router.post("/profile", authWeb, asyncHandler(auth.profile, "getting profile info"));

// microservices profile
router.post("/micro/profile", asyncHandler(auth.microProfile, "getting profile info"));

// profile mobile
router.post("/mob/profile", authMobile, asyncHandler(auth.profile, "getting profile info for mobile"));

// delete account
router.post("/delete", authWeb, asyncHandler(auth.delete, "deleting profile info"));

// delete account mobile
router.post("/mob/delete", authMobile, asyncHandler(auth.delete, "deleting profile info for mobile"));

export default router;