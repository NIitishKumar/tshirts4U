import { Router } from "express";
import {
  getAddresses,
  createAddress,
  editAddress,
  deleteAddress,
} from "./address.controller.js";

const router = Router();

router.get("/:userId/addresses", getAddresses);
router.post("/:userId/addresses", createAddress);
router.put("/:userId/addresses/:addressId", editAddress);
router.delete("/:userId/addresses/:addressId", deleteAddress);

export default router;

