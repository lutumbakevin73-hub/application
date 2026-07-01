import passport from "passport";
import { Strategy as GoogleStrategy }
from "passport-google-oauth20";

import { pool } from "../../db.js";

passport.use(

  new GoogleStrategy(

    {
      clientID:
        process.env.GOOGLE_CLIENT_ID,

      clientSecret:
        process.env.GOOGLE_CLIENT_SECRET,

      callbackURL:
        "/auth/google/callback"
    },

    async (
      accessToken,
      refreshToken,
      profile,
      done
    ) => {

      try {

        const email =
          profile.emails[0].value;

        const username =
          profile.displayName;

        // Vérifier utilisateur

        const [rows] =
          await pool.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
          );

        let user;

        // Existe déjà

        if (rows.length > 0) {

          user = rows[0];

        }

        // Nouveau compte

        else {

          const [result] =
            await pool.query(
              `
              INSERT INTO users
              (username, email, role)
              VALUES (?, ?, ?)
              `,
              [username, email, "user"]
            );

          user = {
            id: result.insertId,
            username,
            email,
            role: "user"
          };

        }

        done(null, user);

      }

      catch (err) {

        done(err, null);

      }

    }

  )

);

export default passport;