import mongoose from "mongoose";
import User from "../user/user.model.js";

function cleanString(value) {
  if (value === null || value === undefined) return undefined;
  const s = String(value).trim();
  return s.length ? s : undefined;
}

function cleanNumber(value) {
  if (value === null || value === undefined) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function cleanAddressInput(input) {
  const obj = input ?? {};
  return {
    firstName: cleanString(obj.firstName),
    lastName: cleanString(obj.lastName),
    phoneNo: cleanString(obj.phoneNo),
    address: cleanString(obj.address),
    city: cleanString(obj.city),
    state: cleanString(obj.state),
    country: cleanString(obj.country),
    postalCode: cleanString(obj.postalCode),
    latitude: cleanNumber(obj.latitude),
    longitude: cleanNumber(obj.longitude),
  };
}

function isValidUserId(userId) {
  return typeof userId === "string" && mongoose.Types.ObjectId.isValid(userId);
}

function requireAtLeastOneField(addressObj) {
  return Object.values(addressObj).some((v) => v !== undefined);
}

export async function listUserAddresses(userId) {
  if (!isValidUserId(userId)) throw new Error("Invalid userId");
  const user = await User.findById(userId).select("address");
  return user?.address ?? [];
}

export async function createUserAddress(userId, addressInput) {
  if (!isValidUserId(userId)) throw new Error("Invalid userId");
  const cleaned = cleanAddressInput(addressInput);
  if (!requireAtLeastOneField(cleaned)) {
    throw new Error("At least one address field is required.");
  }

  const updated = await User.findByIdAndUpdate(
    userId,
    { $push: { address: cleaned } },
    { new: true },
  ).select("address");

  if (!updated) return null;
  return updated.address[updated.address.length - 1] ?? null;
}

export async function editUserAddress(userId, addressId, addressInput) {
  if (!isValidUserId(userId)) throw new Error("Invalid userId");
  if (!mongoose.Types.ObjectId.isValid(addressId)) throw new Error("Invalid addressId");

  const cleaned = cleanAddressInput(addressInput);
  if (!requireAtLeastOneField(cleaned)) {
    throw new Error("At least one address field is required.");
  }

  // Build $set object like: { "address.$.city": "..." }
  const $set = Object.entries(cleaned).reduce((acc, [key, value]) => {
    if (value !== undefined) acc[`address.$.${key}`] = value;
    return acc;
  }, {});

  const updatedUser = await User.findOneAndUpdate(
    { _id: userId, "address._id": addressId },
    { $set },
    { new: true },
  ).select("address");

  if (!updatedUser) return null;

  return (
    updatedUser.address.find((a) => a._id?.toString() === addressId) ?? null
  );
}

export async function deleteUserAddress(userId, addressId) {
  if (!isValidUserId(userId)) throw new Error("Invalid userId");
  if (!mongoose.Types.ObjectId.isValid(addressId)) throw new Error("Invalid addressId");

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $pull: { address: { _id: addressId } } },
    { new: true },
  ).select("address");

  if (!updatedUser) return null;
  return updatedUser.address;
}

