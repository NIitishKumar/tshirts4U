import User from "../user/user.model.js";

export async function getUserByPhone(phone) {

  const user = await User.findOne({ phone });
  if (!user) {
    return null;
  }
  return user.toObject();
}

export function generateOTP() {
  let otp = '';
  const digits = '0123456789';
  for (let i = 0; i < 6; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

export async function createUser(phone) {

  const otp = generateOTP();
  const user = await User.create({ phone, otp, otpExpiry: new Date(Date.now() + 10 * 60 * 1000), otpVerified: false, otpVerifiedAt: null, otpVerifiedBy: null });
  return user;
}

export async function verifyOTP(phone, otp) {
  const user = await User.findOne({ phone });
  if (!user) {
    return null;
  }
  if (user.otp !== otp || user.otpExpiry < new Date()) {
    return null;
  }

  // Update the in-memory document so the returned value has `otpVerified: true`.
  user.otpVerified = true;
  user.otpVerifiedAt = new Date();
  user.otpVerifiedBy = "user";
  await user.save();

  return user.toObject();
}

export async function updateUserOtp(phone, otp) {
  const user = await User.findOne({ phone });
  if (!user) {
    return null;
  }
  user.otp = otp;
  user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
  user.otpVerified = false;
  user.otpVerifiedAt = null;
  user.otpVerifiedBy = null;
  await user.save();
  return user;
}

function toTrimmedString(value) {
  if (value === null || value === undefined) return undefined;
  const s = String(value).trim();
  return s.length ? s : undefined;
}

function toDateOrUndefined(value) {
  if (value === null || value === undefined) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d;
}

/**
 * Creates or updates a user from an external provider (OAuth/etc).
 * Returns the updated user doc as a plain object.
 */
export async function upsertExternalUser(externalUser) {
  const userObj = externalUser ?? {};

  const phone = toTrimmedString(userObj.phone);
  const email = toTrimmedString(userObj.email)?.toLowerCase();
  const id = toTrimmedString(userObj.id);

  let query = null;
  if (phone) query = { phone };
  else if (email) query = { email };
  else if (id) query = { id };

  if (!query) {
    throw new Error("external user must include at least one of: phone, email, id");
  }

  const now = new Date();

  const $set = {
    id: toTrimmedString(userObj.id),
    email: toTrimmedString(userObj.email)?.toLowerCase(),
    name: toTrimmedString(userObj.name),
    phone: phone,

    // Address-related fields (if you pass them).
    address: userObj.address,
    city: toTrimmedString(userObj.city),
    state: toTrimmedString(userObj.state),
    country: toTrimmedString(userObj.country),
    postalCode: toTrimmedString(userObj.postalCode),
    latitude: userObj.latitude === undefined ? undefined : Number(userObj.latitude),
    longitude: userObj.longitude === undefined ? undefined : Number(userObj.longitude),

    // OTP-related fields (so your frontend can pass through `otpVerified`).
    otp: toTrimmedString(userObj.otp),
    otpExpiry: toDateOrUndefined(userObj.otpExpiry),
    otpVerified:
      typeof userObj.otpVerified === "boolean" ? userObj.otpVerified : undefined,
    otpVerifiedAt: toDateOrUndefined(userObj.otpVerifiedAt),
    otpVerifiedBy: toTrimmedString(userObj.otpVerifiedBy),

    updatedAt: now,
  };

  // Remove undefined keys so we don't overwrite fields unintentionally.
  for (const [k, v] of Object.entries($set)) {
    if (v === undefined) delete $set[k];
  }

  const doc = await User.findOneAndUpdate(query, { $set }, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  });

  // Ensure timestamps exist on insert if your schema doesn't use `timestamps: true`.
  if (doc && doc.createdAt == null) {
    doc.createdAt = now;
    await doc.save();
  }

  return doc?.toObject?.() ?? null;
}