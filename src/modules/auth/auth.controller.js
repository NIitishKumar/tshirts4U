export async function postLogin(_req, res) {

  const { getUserByPhone, createUser, generateOTP, updateUserOtp } = await import("./auth.service.js");

  const { phone } = _req.body;
  console.log("phone", phone);

  if (!phone) {
    return res.status(400).json({ ok: false, error: "Phone is required" });
  }

  const user = await getUserByPhone(phone);

  if (user) {
    const otp = generateOTP();
    await updateUserOtp(phone, otp);
    res.json({ ok: true, otp, status: 200 });
    return;
  }

  const newUser = await createUser(phone);
  const otp = generateOTP();
  await updateUserOtp(phone, otp);
  res.json({ ok: true, otp });
  return;
}


export async function postVerifyOTP(req, res) {
  const { verifyOTP } = await import("./auth.service.js");

  const { phone, otp } = req.body;
  console.log("phone", phone);
  console.log("otp", otp);
  const user = await verifyOTP(phone, otp);
  if (!user) {
    return res.status(400).json({ ok: false, error: 'Invalid OTP', user: null, otp: null , status: 400});
  }
  res.json({ ok: true, user });
  return;
}