import { Router } from "express";
import { postExternalSession, postLogin, postVerifyOTP } from "./auth.controller.js";

const router = Router();

router.post("/login", postLogin);
router.post("/verify-otp", postVerifyOTP);
router.post("/external-session", postExternalSession);
// router.post("/logout", postLogout);

export default router;
