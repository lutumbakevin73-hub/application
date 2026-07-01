import * as authService from "../services/auth.service.js";
import { getPostLoginRedirect, getUserProgress } from "../services/progress.service.js";

export async function register(req, res) {
  try {
    const username = req.body.username || req.body.name;
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "E-mail et mot de passe requis" });
    }

    const result = await authService.register({ username, email, password, role });
    res.json({ message: "Inscription réussie", ...result });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

export async function login(req, res) {
  try {
    const email = req.body.email || req.body.username || req.body.name;
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "E-mail et mot de passe requis" });
    }

    const result = await authService.login({ email, password });
    res.json({ message: "Connexion réussie !", ...result });
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
}

export async function me(req, res) {
  try {
    const profile = await authService.getPublicProfile(req.user.id);
    if (!profile) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }
    res.json(profile);
  } catch {
    res.status(500).json({ message: "Erreur serveur" });
  }
}

export async function googleCallback(req, res) {
  const token = authService.generateToken(req.user);
  const progress = await getUserProgress(req.user.id);
  const redirect = getPostLoginRedirect(req.user, progress);
  res.redirect(
    `${process.env.FRONTEND_URL || "http://localhost:5173"}${redirect}?token=${token}`
  );
}
