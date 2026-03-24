export async function postLogin(_req, res) {
  res.status(501).json({
    ok: false,
    error: "Auth not implemented. Implement auth.service (e.g. JWT or sessions).",
  });
}

export async function postLogout(_req, res) {
  res.status(501).json({ ok: false, error: "Auth not implemented." });
}
