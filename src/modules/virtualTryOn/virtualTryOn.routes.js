import { Router } from "express";
import { uploadPhoto } from "../../middlewares/upload.middleware.js";
import { getHealth, postVirtualTryOn } from "./virtualTryOn.controller.js";

const router = Router();

router.get("/health", getHealth);
router.post(
  "/virtual-try-on",
  uploadPhoto.single("photo"),
  postVirtualTryOn,
);

export default router;
