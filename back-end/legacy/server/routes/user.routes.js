import express from "express";
import { pool } from "../../db.js";

const router = express.Router();

// =========================
// UTILISATEUR A FINI TEST
// =========================

router.post("/complete-test", async (req, res) => {

  try {

    const { userId } = req.body;

    await pool.query(

      `
      UPDATE users
      SET has_passed_test = TRUE
      WHERE id = ?
      `,

      [userId]

    );

    res.json({
      success: true
    });

  }

  catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Erreur update user"
    });

  }

});

export default router;