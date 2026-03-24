import multer from "multer";
import { MAX_BYTES } from "../config/constants.js";

export const uploadPhoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES },
});
