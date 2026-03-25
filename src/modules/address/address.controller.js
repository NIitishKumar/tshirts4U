import {
  listUserAddresses,
  createUserAddress,
  editUserAddress,
  deleteUserAddress,
} from "./address.service.js";

export async function getAddresses(req, res) {
  try {
    const { userId } = req.params;
    const addresses = await listUserAddresses(userId);
    res.json({ ok: true, addresses });
  } catch (err) {
    res.status(400).json({ ok: false, error: err?.message ?? "Bad request" });
  }
}

export async function createAddress(req, res) {
  try {
    const { userId } = req.params;
    const address = await createUserAddress(userId, req.body);
    if (!address) {
      return res.status(404).json({ ok: false, error: "User not found." });
    }
    res.json({ ok: true, address });
  } catch (err) {
    res.status(400).json({ ok: false, error: err?.message ?? "Bad request" });
  }
}

export async function editAddress(req, res) {
  try {
    const { userId, addressId } = req.params;
    const address = await editUserAddress(userId, addressId, req.body);
    if (!address) {
      return res.status(404).json({ ok: false, error: "Address not found." });
    }
    res.json({ ok: true, address });
  } catch (err) {
    res.status(400).json({ ok: false, error: err?.message ?? "Bad request" });
  }
}

export async function deleteAddress(req, res) {
  try {
    const { userId, addressId } = req.params;
    const addresses = await deleteUserAddress(userId, addressId);
    if (!addresses) {
      return res.status(404).json({ ok: false, error: "Address not found." });
    }
    res.json({ ok: true, addresses });
  } catch (err) {
    res.status(400).json({ ok: false, error: err?.message ?? "Bad request" });
  }
}

