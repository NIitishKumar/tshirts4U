import { Router } from "express";
import { postLogin, postLogout } from "./auth.controller.js";

const router = Router();

router.post("/login", postLogin);
router.post("/logout", postLogout);

export default router;
