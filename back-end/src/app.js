import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "./config/passport.js";
import { env } from "./config/env.js";
import apiRoutes from "./routes/index.js";
import authRoutes from "./routes/auth.routes.js";
import * as authController from "./controllers/auth.controller.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.frontendUrl,
      credentials: true
    })
  );

  app.use(express.json());

  app.use(
    session({
      secret: env.jwtSecret,
      resave: false,
      saveUninitialized: false
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", db: env.dbClient });
  });

  app.get("/", (_req, res) => {
    res.json({
      message: "UDBL Learning API",
      frontend: env.frontendUrl,
      health: "/health"
    });
  });

  app.use("/api", apiRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/auth", authRoutes);

  if (env.googleClientId && env.googleClientSecret) {
    app.get(
      "/auth/google",
      passport.authenticate("google", { scope: ["profile", "email"] })
    );

    app.get(
      "/auth/google/callback",
      passport.authenticate("google", {
        session: false,
        failureRedirect: `${env.frontendUrl}/login`
      }),
      authController.googleCallback
    );
  }

  return app;
}
