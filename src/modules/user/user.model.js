import mongoose from "mongoose";
import { AddressSchema } from "./address.model.js";

const UserSchema = new mongoose.Schema({   
  id: { type: String },
  email: { type: String },
  name: { type: String },
  phone: { type: String },
  createdAt: { type: Date },
  updatedAt: { type: Date },
  city: { type: String },
  state: { type: String },
  country: { type: String },
  postalCode: { type: String },
  latitude: { type: Number },
  longitude: "number",
  profilePicture: { type: String },
  profilePictureUrl: { type: String },
  profilePictureUrl: { type: String },
  profilePictureUrl: "string",
  otp: { type: String },
  otpExpiry: { type: Date },
  otpVerified: { type: Boolean },
  otpVerifiedAt: { type: Date },
  otpVerifiedBy: { type: String },
  otpVerifiedAt: { type: Date },
  address: [{ type: mongoose.Schema.Types.ObjectId, ref: "Address" }]});

export default mongoose.model("User", UserSchema);
