# BuildAI

AI-assisted triage for property and building faults. A property owner photographs a
crack, a damp patch, a roof issue — anything they're worried about — and BuildAI's
GPT-4o vision analysis gives an instant severity read (urgent / review soon / non-urgent)
with a structured breakdown, while a human expert claims the report, reviews the AI's
read, and adds their own assessment before anything gets acted on.

**Live demo:** _add your deployed URL here once hosted (see Deployment below)_
**Screenshots:** _add a few screenshots or a short GIF of the dashboard, report submission, and expert review panel_

## Why this exists

AI image analysis is good at a fast first pass, not a final answer — especially for
anything safety-related. BuildAI is built around that idea: every report gets an
AI triage the moment it's submitted, but nothing is presented to the property owner
as final until a real expert has claimed it and signed off. The UI is explicit about
this at every step (confidence scores, an "AI assessment only" banner, a visible
"awaiting expert review" state).

## Features

**Property owner**
- Submit a report with a photo (drag-and-drop upload via Cloudinary), fault type,
  location, duration, and description
- Instant AI triage: predicted fault type, confidence score, urgency level, and a
  five-factor severity breakdown (STEAM: Structural / Type / Extent / Age / Materials)
- Differential list — the AI's ranked alternative explanations, not just its top guess
- Full edit history on every report, with a snapshot saved on each change
- Book a site visit with an expert, tied to a specific report
- Dashboard with report counts by severity and upcoming visits

**Expert**
- A live triage queue sorted by urgency, with unclaimed reports surfaced first
- Claim a report to review it; request a second opinion from a colleague on any report
- Structured review panel: edit the STEAM flags, set the priority level, and leave
  assessment notes that become visible to the property owner
- Team view of all claimed reports, plus a dedicated site-visit calendar

**Platform**
- JWT-based auth with separate property-owner / expert roles
- Password reset flow with hashed, time-limited tokens
- Rate limiting on login, registration, and password-reset requests
- CORS locked to the configured frontend origin

## Tech stack

- **Frontend:** React 19, Vite, plain CSS (no framework) — `src/`
- **Backend:** Node.js, Express 5, Mongoose (MongoDB) — `backend/`
- **AI:** OpenAI GPT-4o (vision) for fault triage, with a keyword-based fallback if the
  API call fails
- **Image storage:** Cloudinary
- **Auth:** JSON Web Tokens, bcrypt password hashing

## Project structure

```
BuildAI/
├── src/                  # React frontend
│   ├── pages/             # AuthPage, PatientPage, DoctorPage
│   ├── components/        # Dashboards, case result/review panels, modals
│   ├── sections/           # Feature cards (create case, book appointment, etc.)
│   └── api.js              # Fetch wrapper + typed API client
└── backend/               # Express API
    ├── models/             # User, Case, Appointment (Mongoose schemas)
    ├── routes/             # auth, cases, appointments, users, upload
    ├── middleware/         # JWT auth, role guard, rate limiter
    └── server.js
```

## Running locally

You'll need Node 18+, a MongoDB instance (local or [Atlas](https://www.mongodb.com/atlas)),
an [OpenAI API key](https://platform.openai.com/api-keys), and a
[Cloudinary](https://cloudinary.com/) account (free tier is enough for all three).

```bash
# 1. clone and install
git clone <your-repo-url>
cd BuildAI
npm install
cd backend && npm install && cd ..

# 2. configure the backend
cd backend
cp .env.example .env
# fill in MONGO_URI, JWT_SECRET, OPENAI_API_KEY, CLOUDINARY_* in .env
npm run dev            # starts the API on http://localhost:5000
```

In a second terminal:

```bash
# 3. run the frontend
npm run dev             # starts Vite on http://localhost:5173
```

The frontend proxies `/api` requests to the backend (see `vite.config.js`), so no
extra CORS setup is needed for local development.

## Deployment

- **Database:** [MongoDB Atlas](https://www.mongodb.com/atlas) free tier
- **Backend:** [Render](https://render.com) or [Railway](https://railway.app) — point
  it at this repo's `backend/` folder, set the same env vars from `.env.example` in
  their dashboard, and set `FRONTEND_URL` to your deployed frontend's URL
- **Frontend:** [Vercel](https://vercel.com) or [Netlify](https://netlify.com) — both
  auto-detect Vite; set an env var pointing API calls at your deployed backend URL
  (or update the Vite proxy / `api.js` base URL) before building for production

## Known limitations

- Single-server deployment only — the in-memory rate limiter and AI response caching
  (none yet) don't share state across multiple backend instances
- No automated test suite yet (manual verification only)
- AI triage cost scales with usage — there's no per-user request cap beyond the login
  rate limiter

## License

_Add a license if you want this reused — MIT is a common, permissive default for
portfolio projects._
