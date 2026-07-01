import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { findUserById } from "../services/auth.service.js";
import { getUserProgress } from "../services/progress.service.js";

export function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token manquant" });
  }

  try {
    req.user = jwt.verify(auth.split(" ")[1], env.jwtSecret);
    next();
  } catch {
    return res.status(401).json({ message: "Token invalide ou expiré" });
  }
}

export async function requireTestPassed(req, res, next) {
  try {
    const user = await findUserById(req.user.id);
    if (!user?.has_passed_test) {
      return res.status(403).json({
        message: "Vous devez d'abord terminer le test de niveau."
      });
    }
    next();
  } catch {
    return res.status(500).json({ message: "Erreur serveur" });
  }
}

export async function requireTestNotPassed(req, res, next) {
  try {
    const user = await findUserById(req.user.id);
    if (user?.has_passed_test) {
      return res.status(403).json({
        message: "Vous avez déjà passé le test de niveau."
      });
    }
    next();
  } catch {
    return res.status(500).json({ message: "Erreur serveur" });
  }
}

export async function requireProgramNotChosen(req, res, next) {
  try {
    const progress = await getUserProgress(req.user.id);
    if (progress.has_chosen_program) {
      return res.status(409).json({
        message: "Vous avez déjà choisi votre programme.",
        programId: progress.program_id
      });
    }
    next();
  } catch {
    return res.status(500).json({ message: "Erreur serveur" });
  }
}

export async function requireProgramChosen(req, res, next) {
  try {
    const progress = await getUserProgress(req.user.id);
    if (!progress.has_chosen_program) {
      return res.status(403).json({
        message: "Vous devez d'abord choisir votre programme."
      });
    }
    next();
  } catch {
    return res.status(500).json({ message: "Erreur serveur" });
  }
}

export async function requireAgendaSaved(req, res, next) {
  try {
    const progress = await getUserProgress(req.user.id);
    if (!progress.has_saved_agenda) {
      return res.status(403).json({
        message: "Vous devez d'abord enregistrer votre agenda."
      });
    }
    next();
  } catch {
    return res.status(500).json({ message: "Erreur serveur" });
  }
}
