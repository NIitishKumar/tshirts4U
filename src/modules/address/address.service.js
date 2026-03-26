import mongoose from "mongoose";
import User from "../user/user.model.js";
import Address from "../user/address.model.js";

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
    phone: cleanString(obj.phone),
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
  const user = await User.findById(userId).populate("address");
  return user?.address ?? [];
}

export async function createUserAddress(userId, addressInput) {
  if (!isValidUserId(userId)) throw new Error("Invalid userId");
  const user = await User.findById(userId);
  if (!user) return null;

  const cleaned = cleanAddressInput(addressInput);
  if (!requireAtLeastOneField(cleaned)) {
    throw new Error("At least one address field is required.");
  }

  const address = new Address(cleaned);
  await address.save();
  await User.findByIdAndUpdate(userId, { $push: { address: address._id } });
  return address;
}

export async function editUserAddress(userId, addressId, addressInput) {
  if (!isValidUserId(userId)) throw new Error("Invalid userId");
  if (!mongoose.Types.ObjectId.isValid(addressId)) throw new Error("Invalid addressId");

  const cleaned = cleanAddressInput(addressInput);
  if (!requireAtLeastOneField(cleaned)) {
    throw new Error("At least one address field is required.");
  }

  const userHasAddress = await User.exists({ _id: userId, address: addressId });
  if (!userHasAddress) return null;

  const $set = Object.entries(cleaned).reduce((acc, [key, value]) => {
    if (value !== undefined) acc[key] = value;
    return acc;
  }, {});

  if (!Object.keys($set).length) return null;

  const updatedAddress = await Address.findByIdAndUpdate(
    addressId,
    { $set },
    { new: true },
  );
  return updatedAddress;
}

export async function deleteUserAddress(userId, addressId) {
  if (!isValidUserId(userId)) throw new Error("Invalid userId");
  if (!mongoose.Types.ObjectId.isValid(addressId)) throw new Error("Invalid addressId");

  const updatedUser = await User.findOneAndUpdate(
    { _id: userId, address: addressId },
    { $pull: { address: addressId } },
    { new: true },
  ).populate("address");

  if (!updatedUser) return null;
  await Address.findByIdAndDelete(addressId);
  return updatedUser.address;
}

