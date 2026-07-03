# UDBL Learning

Plateforme d'apprentissage personnalisé en programmation (C & Python) avec IA.

## Structure

```
application/
├── back-end/          # API Express (Node.js)
│   ├── src/
│   │   ├── config/    # env, database
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── agents/    # prompts IA
│   │   ├── middleware/
│   │   └── db/migrations/
│   └── data/          # SQLite (généré)
├── front-end/         # React + Vite + Tailwind
└── legacy-front-end/  # anciennes pages HTML
```

## Démarrage rapide

**Prérequis : Node.js 20.19+** (obligatoire pour Vite 8). Vérifiez avec `node -v`.

### 1. Back-end

```bash
cd back-end
cp .env.example .env   # Windows : copy .env.example .env
npm run setup-env      # crée .env avec les clés de test (Groq…)
npm install
npm start
```

API : http://localhost:5000

### 2. Front-end

```bash
cd front-end
npm install
npm run dev
```

App : http://localhost:5173

> **Important :** lancez toujours `npm install` et `npm run dev` **depuis le dossier `front-end/`**, pas depuis la racine `application/` (sinon erreur `ENOENT package.json`).

### Compte admin (première installation)

```bash
cd back-end
npm run create-admin
```

## Base de données

Par défaut : **SQLite** (`back-end/data/udbl.db`).

Pour **MySQL**, dans `.env` :

```env
DB_CLIENT=mysql2
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=learning_app
```

Puis créez la base et lancez :

```bash
npm run migrate
```

## Variables d'environnement

| Variable | Description |
|----------|-------------|
| `DB_CLIENT` | `sqlite3` (défaut) ou `mysql2` |
| `GROQ_API_KEY` | Génération IA (test, cours, correction) |
| `JWT_SECRET` | Secret pour les tokens |
| `FRONTEND_URL` | URL React (CORS) |
| `TWILIO_*` | Rappels SMS (optionnel) |

## Parcours utilisateur

1. Inscription / Connexion
2. Test de niveau (24 questions)
3. Programme d'étude généré par IA
4. Planification des séances + rappels SMS
