import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getDb, insertAndGetId } from "../config/database.js";
import { env } from "../config/env.js";
import { getPostLoginRedirect, getUserProgress } from "./progress.service.js";

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    env.jwtSecret,
    { expiresIn: "2h" }
  );
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export async function findUserByEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return null;
  }
  return getDb()("users").where({ email: normalized }).first();
}

export async function findUserById(id) {
  return getDb()("users").where({ id }).first();
}

export async function register({ username, email, password }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !password) {
    throw new Error("E-mail et mot de passe requis");
  }

  const displayName =
    String(username || "").trim() || normalizedEmail.split("@")[0];

  if (await findUserByEmail(normalizedEmail)) {
    throw new Error("Email déjà utilisé");
  }

  const hashed = await bcrypt.hash(password, 10);
  const id = await insertAndGetId("users", {
    username: displayName,
    email: normalizedEmail,
    password: hashed,
    role: "user"
  });

  const user = {
    id,
    username: displayName,
    email: normalizedEmail,
    role: "user",
    has_passed_test: false
  };

  return { user, token: generateToken(user) };
}

export async function login({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !password) {
    throw new Error("E-mail et mot de passe requis");
  }

  const user = await findUserByEmail(normalizedEmail);
  if (!user) {
    throw new Error("Aucun compte trouvé avec cet e-mail.");
  }

  if (!user.password) {
    throw new Error("Mot de passe non défini pour ce compte.");
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new Error("Mot de passe incorrect");
  }

  const token = generateToken(user);
  const progress = await getUserProgress(user.id);
  const redirect = getPostLoginRedirect(user, progress);

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      has_passed_test: Boolean(user.has_passed_test),
      preferred_language: user.preferred_language || null,
      ...progress
    },
    redirect
  };
}

export async function getPublicProfile(userId) {
  const user = await findUserById(userId);
  if (!user) {
    return null;
  }

  const progress = await getUserProgress(userId);

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    has_passed_test: Boolean(user.has_passed_test),
    preferred_language: user.preferred_language || null,
    ...progress,
    created_at: user.created_at
  };
}
