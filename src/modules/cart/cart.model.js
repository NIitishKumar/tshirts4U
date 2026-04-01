import mongoose from "mongoose";

const CartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    size: { type: String, trim: true, default: "" },
    color: { type: String, trim: true, default: "" },
  },
  { _id: true },
);

const CartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: { type: [CartItemSchema], default: [] },
  },
  { timestamps: true },
);

const Cart = mongoose.models.Cart || mongoose.model("Cart", CartSchema);

export default Cart;
