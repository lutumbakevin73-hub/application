import express from "express";
import crypto from "crypto";
import bcrypt from "bcrypt";

import { pool } from "../../db.js";
import { transporter } from "../utils/mailer.js";

const router = express.Router();

// =========================
// FORGOT PASSWORD
// =========================

router.post("/forgot-password", async (req, res) => {

  try {

    const { email } = req.body;

    const [rows] = await pool.query(

      `
      SELECT * FROM users
      WHERE email = ?
      `,

      [email]

    );

    if(rows.length === 0){

      return res.status(404).json({
        error: "Utilisateur introuvable"
      });

    }

    const user = rows[0];

    // TOKEN

    const token =
      crypto.randomBytes(32).toString("hex");

    // EXPIRATION

    const expire =
      new Date(Date.now() + 3600000);

    // SAVE DB

    await pool.query(

      `
      UPDATE users
      SET reset_token = ?,
      reset_token_expire = ?
      WHERE id = ?
      `,

      [
        token,
        expire,
        user.id
      ]

    );

    // LINK RESET

    const resetLink =

`http://localhost:5000/reset-password.html?token=${token}`;

    // SEND MAIL

    await transporter.sendMail({

      from: process.env.EMAIL_USER,

      to: email,

      subject: "Réinitialisation mot de passe",

      html: `

      <h2>Réinitialisation</h2>

      <p>
      Cliquez sur le lien ci-dessous :
      </p>

      <a href="${resetLink}">
      Réinitialiser mot de passe
      </a>

      `

    });

    res.json({
      success: true,
      message: "Email envoyé"
    });

  }

  catch(error){

    console.error(error);

    res.status(500).json({
      error: "Erreur serveur"
    });

  }

});

// =========================
// RESET PASSWORD
// =========================

router.post("/reset-password", async (req, res) => {

  try {

    const { token, newPassword } = req.body;

    const [rows] = await pool.query(

      `
      SELECT * FROM users
      WHERE reset_token = ?
      `,

      [token]

    );

    if(rows.length === 0){

      return res.status(400).json({
        error: "Token invalide"
      });

    }

    const user = rows[0];

    // TOKEN EXPIRE

    if(new Date() > new Date(user.reset_token_expire)){

      return res.status(400).json({
        error: "Token expiré"
      });

    }

    // HASH PASSWORD

    const hashed =
      await bcrypt.hash(newPassword, 10);

    // UPDATE PASSWORD

    await pool.query(

      `
      UPDATE users
      SET password = ?,
      reset_token = NULL,
      reset_token_expire = NULL
      WHERE id = ?
      `,

      [
        hashed,
        user.id
      ]

    );

    res.json({
      success: true,
      message: "Mot de passe modifié"
    });

  }

  catch(error){

    console.error(error);

    res.status(500).json({
      error: "Erreur reset"
    });

  }

});

export default router;