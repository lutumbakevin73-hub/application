import express from "express";
import { db } from "../config/firebase.js";

const router = express.Router();

// =========================
// SAUVEGARDE AGENDA
// =========================

router.post("/save", async (req, res) => {

  try {

    const { phone, sessions, program } = req.body;

    // VALIDATION
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Numéro de téléphone requis"
      });
    }

    if (!Array.isArray(sessions) || sessions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Sessions invalides"
      });
    }

    const incomplete = sessions.some(
      s => !s.date || !s.time
    );

    if (incomplete) {
      return res.status(400).json({
        success: false,
        message: "Toutes les séances doivent être complètes"
      });
    }

    // STRUCTURE AGENDA
    const agenda = {
      phone,
      program,
      sessions,
      createdAt: new Date()
    };

    // SAUVEGARDE FIREBASE
    const docRef = await db.collection("agendas").add(agenda);

    console.log("✅ Agenda sauvegardé :", docRef.id);

    return res.json({
      success: true,
      message: "Agenda enregistré",
      agendaId: docRef.id,
      agenda
    });

  } catch (error) {

    console.error("Agenda error :", error);

    return res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });

  }

});

export default router;