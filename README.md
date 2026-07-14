# UDBL Learning

Plateforme d'apprentissage personnalisé en programmation (**C** ou **Python**) avec génération IA (Groq), parcours guidé pour les étudiants et espace d'administration.

## Structure du projet

```
application/
├── back-end/              # API Express (Node.js)
│   ├── src/
│   │   ├── index.js       # Point d'entrée
│   │   ├── app.js         # Configuration Express + CORS
│   │   ├── config/        # env, base de données, langages, programmes
│   │   ├── controllers/   # Handlers HTTP
│   │   ├── routes/        # Routes API (/api/...)
│   │   ├── services/      # Logique métier
│   │   ├── agents/        # Prompts IA
│   │   ├── middleware/    # Auth JWT, garde-fous du parcours
│   │   ├── db/migrations/ # Schéma SQLite / MySQL (Knex)
│   │   └── utils/         # Mailer, fuseau horaire séances
│   ├── scripts/           # create-admin, setup-env, migrations...
│   └── data/              # SQLite généré (udbl.db)
└── front-end/             # React + Vite + Tailwind
    ├── src/
    │   ├── pages/         # Pages étudiant + admin
    │   ├── components/    # UI réutilisable
    │   ├── context/       # Auth, modales
    │   ├── api/client.js  # Appels vers l'API
    │   └── config/        # Parcours, programmes
    └── public/udbl.jpg    # Logo
```

## Démarrage rapide

**Prérequis : Node.js 20.19+** (Vite 8). Vérifiez avec `node -v`.

### 1. Back-end

```bash
cd back-end
copy .env.example .env    # Windows
npm run setup-env         # crée .env si absent
npm install
npm run migrate
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

> Lancez toujours `npm run dev` **depuis `front-end/`**, pas depuis la racine.

### Compte admin (première installation)

```bash
cd back-end
npm run create-admin
```

---

## Comment fonctionne l'application

### Vue d'ensemble

1. L'étudiant **s'inscrit** ou **se connecte** (e-mail + mot de passe, JWT).
2. Il **choisit un langage** : C ou Python (parcours mono-langage).
3. Il passe un **test d'entrée** (~10 questions QCM + code, corrigées par IA).
4. Les résultats sont **enregistrés** en base (`test_results`) : score, lacunes par thème, programme recommandé.
5. Un **programme de leçons** est généré par IA selon le score et les lacunes.
6. L'étudiant **planifie son agenda** (dates/heures des séances).
7. Il suit les **cours** (leçon → exercice → quiz → bilan) leçon par leçon.
8. Des **SMS** (Twilio, optionnel) rappellent les séances 15 min avant.

L'**admin** consulte utilisateurs, agendas, progression et résultats du test d'entrée.

### Parcours étudiant (étapes)

| Étape | Route | Condition d'accès |
|-------|-------|-------------------|
| Choix langage | `/language` | Pas encore de langage ni test passé |
| Test | `/test` → `/quiz` | Langage choisi, test non passé |
| Programme | `/plan` | Test passé, programme non choisi |
| Agenda | `/agenda` | Programme généré, agenda non sauvegardé |
| Cours | `/sessions` | Agenda sauvegardé |

La **sidebar** et la **barre de progression** du parcours apparaissent une fois l'agenda enregistré.

### Test d'entrée

- `POST /api/test/start` — génère les questions (IA) pour le langage choisi.
- Pendant le quiz : QCM local ou `POST /api/test/correct-code` pour les questions code.
- À la fin : `POST /api/user/complete-test` enregistre score, `by_theme`, lacunes, programme recommandé (`prog1`…`prog4`).

### Programme et cours

- `POST /api/study/register` — crée le programme + séances IA (`study_programs`, `study_sessions`).
- `GET /api/study/current` — récupère le programme actif.
- Chaque leçon : contenu cours, exercice, mini-quiz (score min. 70 %).
- `POST /api/study/progress` — sauvegarde leçons validées et tentatives quiz (`lesson_progress`).

### Agenda et SMS

- `POST /api/agenda/save` — enregistre les créneaux (`agendas`).
- Service `reminder.service.js` : cron qui envoie des rappels SMS (Twilio) ~15 min avant chaque séance.
- `SMS_TEST_MODE=true` : envoi de test à chaque sauvegarde d'agenda.

### Espace admin (`/admin`)

| Page | Rôle |
|------|------|
| Tableau de bord | Stats, progression globale, prochaines séances |
| Utilisateurs | Liste, suppression de comptes |
| Progression | Test d'entrée, lacunes détaillées, évolution par thème, détail par leçon |
| Agendas / Séances | Consultation des plannings |

API : `GET /api/admin/dashboard`, `/users`, `/progress`, `/agendas`…

### Authentification

- Inscription / connexion : `POST /api/register`, `POST /api/login`
- Token JWT stocké côté client ; `GET /api/me` pour le profil
- Rôles : `user` (étudiant) ou `admin`
- Pas de connexion Google (auth e-mail/mot de passe uniquement)

### Base de données

Par défaut : **SQLite** (`back-end/data/udbl.db`).

Tables principales : `users`, `test_results`, `study_programs`, `study_sessions`, `lesson_progress`, `agendas`.

Pour **MySQL** :

```env
DB_CLIENT=mysql2
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=learning_app
```

```bash
npm run migrate
```

### Variables d'environnement

| Variable | Description |
|----------|-------------|
| `DB_CLIENT` | `sqlite3` (défaut) ou `mysql2` |
| `GROQ_API_KEY` | Génération IA (test, cours, correction code) |
| `JWT_SECRET` | Secret tokens JWT |
| `FRONTEND_URL` | URL React (CORS) |
| `TWILIO_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE` | SMS (optionnel) |
| `SMS_TEST_MODE` | `true` = SMS test à chaque agenda |
| `APP_TIMEZONE` / `APP_TIMEZONE_OFFSET` | Fuseau Lubumbashi (UTC+2) |

---

## Scripts utiles

```bash
cd back-end
npm run dev              # API avec rechargement
npm run migrate          # Appliquer les migrations
npm run create-admin     # Créer un compte admin
npm run promote-admin    # Promouvoir un utilisateur
```

```bash
cd front-end
npm run build            # Build production
npm run lint             # Vérification oxlint
```
