import * as passwordService from "../services/password.service.js";

export async function forgotPassword(req, res) {
  try {
    const result = await passwordService.requestPasswordReset(req.body.email);
    res.json(result);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
}

export async function resetPassword(req, res) {
  try {
    const result = await passwordService.resetPassword(
      req.body.token,
      req.body.newPassword
    );
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
