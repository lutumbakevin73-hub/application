import { findUserById } from "../services/auth.service.js";
import * as userService from "../services/user.service.js";

export async function completeTest(req, res) {
  try {
    const { userId } = req.body;
    if (userId && Number(userId) !== req.user.id) {
      return res.status(403).json({ error: "Accès refusé" });
    }

    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "Utilisateur introuvable" });
    }
    if (user.has_passed_test) {
      return res.status(403).json({ message: "Vous avez déjà passé le test de niveau." });
    }

    await userService.markTestComplete(req.user.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}
