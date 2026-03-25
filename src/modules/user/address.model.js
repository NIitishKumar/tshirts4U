import mongoose from "mongoose";

// Reusable address subdocument schema.
// Kept as `_id: false` since addresses are typically embedded inside another document (like `User`).
export const AddressSchema = new mongoose.Schema(
  {
    address: { type: String, trim: true }, // street address / address line
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    latitude: { type: Number },
    longitude: { type: Number },
  },
  { _id: false }
);

