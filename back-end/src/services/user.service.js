import { getDb } from "../config/database.js";
import { normalizeLearningLanguage } from "../config/languages.js";
import { findUserById } from "./auth.service.js";

export async function markTestComplete(userId) {
  await getDb()("users").where({ id: userId }).update({ has_passed_test: true });
}

export async function setPreferredLanguage(userId, language) {
  const normalized = normalizeLearningLanguage(language);
  if (!normalized) {
    throw new Error("Langage invalide. Choisissez C ou Python.");
  }

  const user = await findUserById(userId);
  if (!user) {
    throw new Error("Utilisateur introuvable");
  }

  if (user.has_passed_test && user.preferred_language && user.preferred_language !== normalized) {
    throw new Error("Le langage ne peut plus être modifié après le test de niveau.");
  }

  await getDb()("users").where({ id: userId }).update({ preferred_language: normalized });

  return normalized;
}
