//  Importations
//code correcte
import passwordRoutes from "./server/routes/password.routes.js";
import userRoutes from "./server/routes/user.routes.js";
import session from "express-session";
import passport from "./server/auth/googleAuth.js";
import express from "express";
import studyRoutes from "./server/routes/study.routes.js";
import dotenv from "dotenv";
import testRoutes from "./server/routes/test.routes.js";
import cors from "cors";
import path from "path";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
//import path from "path";
import { pool } from "./db.js";
import { fileURLToPath } from "url"; // nécessaire pour __dirname avec ES modules
import agendaRoutes from "./server/routes/agenda.routes.js";
import { startReminderService } from "./services/reminder.service.js";

//startReminderService();

dotenv.config();

//console.log("Clé Gemini chargée ?", process.env.GEMINI_API_KEY ? "OUI" : "NON");
//console.log("Clé Gemini chargée :", process.env.GEMINI_API_KEY);
console.log("Serveur prêt (Groq actif)");


const app = express();
const PORT = process.env.PORT || 5000;

//  Pour gérer __dirname avec ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();

});
app.use(cors());
app.use(express.json());
app.use("/api/study", studyRoutes);
app.use("/api/password", passwordRoutes);
//app.use(express.json());
app.use("/api/agenda", agendaRoutes);
//  Démarrer le service de rappel
startReminderService();
//const PORT = 5000;
/*app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});*/
//monter la route
app.use("/api/test", testRoutes);
app.get(
  "/auth/google",

  passport.authenticate(
    "google",
    {
      scope: ["profile", "email"]
    }
  )
);
app.use("/api/user", userRoutes);
//  Servir les fichiers statiques du front-end
app.use(express.static(path.join(__dirname, "../front-end")));
// -------------------- Helpers --------------------
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );
}

async function findUserByEmail(email) {
  const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
  return rows[0];
}

async function findUserByUsername(username) {
  const [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [username]);
  return rows[0];
}

// Middleware d’authentification pour routes protégées
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token manquant" });
  }
  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ message: "Token invalide ou expiré" });
  }
}
// -------------------- Routes Auth --------------------

// Inscription
app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Champs requis manquants" });
    }

    // Unicité email + username
    if (await findUserByEmail(email)) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }
    if (await findUserByUsername(username)) {
      return res.status(400).json({ message: "Nom d'utilisateur déjà utilisé" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
      [username, email, hashed, role === "admin" ? "admin" : "user"]
    );

    const user = { id: result.insertId, username, email, role: role === "admin" ? "admin" : "user" };
    const token = generateToken(user);

    res.json({ message: "Inscription réussie ", token, user });
  } catch (err) {
    console.error("Erreur /api/register:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});
// Connexion
/*app.post("/api/login", async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    if (!emailOrUsername || !password) {
      return res.status(400).json({ message: "Champs requis manquants" });
    }
  }})*/
    // Route login
app.post("/api/login", async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      return res.status(400).json({ message: "Champs requis manquants" });
    }

    const [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [name]);

    if (rows.length === 0) {
      return res.status(401).json({ message: "Vous n'êtes pas inscrit, veuillez d'abord vous inscrire." });
    }

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Mot de passe incorrect" });
    }

    /*const token = generateToken(user);
    res.json({ message: "Connexion réussie !", token });*/
    const token = generateToken(user);

// =========================
// VERIFIER SI TEST PASSE
// =========================

if (user.has_passed_test) {

  return res.json({

    message: "Connexion réussie !",

    token,

    redirect: "plan_etude.html"

  });

}

// =========================
// SI TEST PAS ENCORE PASSE
// =========================

res.json({

  message: "Connexion réussie !",

  token,

  redirect: "test.html"

});
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
 
});

app.post("/api/user/complete-test", async (req, res) => {

  try {
    const { userId } = req.body;
    await pool.query(
      "UPDATE users SET has_passed_test = 1 WHERE id = ?",
      [userId]
    );
    res.json({
      success: true
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Erreur serveur"
    });
  }
});
// Exemple de route protégée
app.get("/api/me", authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, username, email, role, created_at FROM users WHERE id = ?", [req.user.id]);
    res.json(rows[0]);
  } catch (err) {
    console.error("Erreur /api/me:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});
//  Route racine → accueil.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../front-end/aceuil.html"));
});
//  Route pour afficher communication.html
app.get("/test", (req, res) => {
  res.sendFile(path.join(__dirname, "../front-end/test.html"));
});
//  Endpoint API pour discuter avec Gemini
// ================= GOOGLE AUTH =================
app.get(
  "/auth/google",
  passport.authenticate(
    "google",
    {
      scope: ["profile", "email"]
    }
  )
);
app.get(
  "/auth/google/callback",
  passport.authenticate(
    "google",
    {
      session: false,
      failureRedirect: "/connexion.html"
    }
  ),
  (req, res) => {
    const token = generateToken(req.user);
    res.redirect(
      `http://localhost:5000/test.html?token=${token}`
    );
  }
);
//  Lancer serveur
app.listen(PORT, () => {
  console.log(` Serveur en marche sur http://localhost:${PORT}`);
});
