import { validateCreateUserBody } from "./user.validation.js";
import { getUserById, listUsers } from "./user.service.js";

export async function getUsers(_req, res) {
  const users = await listUsers();
  res.json({ ok: true, users });
}

export async function getUser(req, res) {
  const user = await getUserById(req.params.id);
  if (!user) {
    res.status(404).json({ ok: false, error: "User not found." });
    return;
  }
  res.json({ ok: true, user });
}

export async function createUser(req, res) {
  const v = validateCreateUserBody(req.body);
  if (!v.ok) {
    res.status(400).json({ ok: false, error: v.error });
    return;
  }
  res.status(501).json({
    ok: false,
    error: "User registration not implemented. Wire user.service to your database.",
  });
}
