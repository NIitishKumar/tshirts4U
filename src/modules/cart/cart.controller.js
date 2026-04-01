import {
  addOrIncrementItem,
  clearCart,
  getCartWithItems,
  removeLineItem,
  setLineQuantity,
} from "./cart.service.js";

export async function getCart(req, res) {
  try {
    const { userId } = req.params;
    const result = await getCartWithItems(userId);
    if (!result) {
      return res.status(404).json({ ok: false, error: "User not found." });
    }
    const { cart, itemCount, subtotal } = result;
    res.json({ ok: true, cart, itemCount, subtotal });
  } catch (err) {
    res.status(400).json({ ok: false, error: err?.message ?? "Bad request" });
  }
}

export async function postCartItem(req, res) {
  try {
    const { userId } = req.params;
    const result = await addOrIncrementItem(userId, req.body);
    if (!result) {
      return res.status(404).json({ ok: false, error: "User not found." });
    }
    const { cart, itemCount, subtotal } = result;
    res.json({ ok: true, cart, itemCount, subtotal });
  } catch (err) {
    res.status(400).json({ ok: false, error: err?.message ?? "Bad request" });
  }
}

export async function patchCartItem(req, res) {
  try {
    const { userId, lineItemId } = req.params;
    const result = await setLineQuantity(
      userId,
      lineItemId,
      req.body?.quantity,
    );
    if (!result) {
      return res.status(404).json({ ok: false, error: "Cart or line not found." });
    }
    const { cart, itemCount, subtotal } = result;
    res.json({ ok: true, cart, itemCount, subtotal });
  } catch (err) {
    res.status(400).json({ ok: false, error: err?.message ?? "Bad request" });
  }
}

export async function deleteCartItem(req, res) {
  try {
    const { userId, lineItemId } = req.params;
    const result = await removeLineItem(userId, lineItemId);
    if (!result) {
      return res.status(404).json({ ok: false, error: "Cart or line not found." });
    }
    const { cart, itemCount, subtotal } = result;
    res.json({ ok: true, cart, itemCount, subtotal });
  } catch (err) {
    res.status(400).json({ ok: false, error: err?.message ?? "Bad request" });
  }
}

export async function deleteCart(req, res) {
  try {
    const { userId } = req.params;
    const result = await clearCart(userId);
    if (!result) {
      return res.status(404).json({ ok: false, error: "User not found." });
    }
    const { cart, itemCount, subtotal } = result;
    res.json({ ok: true, cart, itemCount, subtotal });
  } catch (err) {
    res.status(400).json({ ok: false, error: err?.message ?? "Bad request" });
  }
}
