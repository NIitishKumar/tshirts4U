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
    User.updateOne({ phone }, { $set: { otpVerified: true, otpVerifiedAt: new Date(), otpVerifiedBy: 'user' } });
  return user;
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