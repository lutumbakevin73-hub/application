import crypto from "crypto";
import bcrypt from "bcrypt";
import { getDb } from "../config/database.js";
import { env } from "../config/env.js";
import { transporter } from "../utils/mailer.js";

export async function requestPasswordReset(email) {
  const user = await getDb()("users").where({ email }).first();
  if (!user) {
    throw new Error("Utilisateur introuvable");
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expire = new Date(Date.now() + 3600000);

  await getDb()("users").where({ id: user.id }).update({
    reset_token: token,
    reset_token_expire: expire
  });

  if (env.emailUser && env.emailPass && env.emailPass !== "mot_de_passe_application_google") {
    const resetLink = `${env.frontendUrl}/reset-password?token=${token}`;
    await transporter.sendMail({
      from: env.emailUser,
      to: email,
      subject: "Réinitialisation mot de passe",
      html: `<p><a href="${resetLink}">Réinitialiser mon mot de passe</a></p>`
    });
  }

  return { success: true, message: "Email envoyé" };
}

export async function resetPassword(token, newPassword) {
  const user = await getDb()("users").where({ reset_token: token }).first();
  if (!user) {
    throw new Error("Token invalide");
  }
  if (new Date() > new Date(user.reset_token_expire)) {
    throw new Error("Token expiré");
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await getDb()("users").where({ id: user.id }).update({
    password: hashed,
    reset_token: null,
    reset_token_expire: null
  });

  return { success: true, message: "Mot de passe modifié" };
}
