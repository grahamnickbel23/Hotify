import { Router } from "express";
import { sendEmailLogic } from "../controller/email logic.js";
import { asyncHandler } from "../utils/asyncHandeller utils.js";

const router = Router();

router.post("/send", asyncHandler(sendEmailLogic, "sending email"));

export default router;