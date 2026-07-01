import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { env } from "../config/env.js";
import { findOrCreateGoogleUser } from "../services/auth.service.js";

export function configureGoogleAuth() {
  if (!env.googleClientId || !env.googleClientSecret) {
    console.warn("Google OAuth désactivé (clés manquantes).");
    return passport;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.googleClientId,
        clientSecret: env.googleClientSecret,
        callbackURL: "/auth/google/callback"
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const user = await findOrCreateGoogleUser(profile);
          done(null, user);
        } catch (err) {
          done(err, null);
        }
      }
    )
  );

  return passport;
}

export default configureGoogleAuth();
