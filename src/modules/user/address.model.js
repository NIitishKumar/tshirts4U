import mongoose from "mongoose";

// Reusable address subdocument schema.
// We keep the default embedded `_id` enabled so address CRUD can target a specific item.
export const AddressSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true }, // street address / address line
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    latitude: { type: Number },
    longitude: { type: Number },
  },
  {}
);

export default mongoose.model("Address", AddressSchema);