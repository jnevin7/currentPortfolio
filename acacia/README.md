# Acacia

A lightweight, text-first social feed, built around one idea: most social
platforms waste bandwidth on things nobody asked for. Acacia strips that
out — no images, no infinite autoplay, no tracking pixels — and makes the
cost of that visible instead of hiding it.

**What that looks like in practice:**

- Every post shows its own byte size next to it, so the weight of what
  you're posting is never hidden.
- A hard 280-character cap keeps posts short by design, not by convention.
- Three themes, including a terminal-style mode, all plain CSS with no
  images or custom fonts to download.
- Nothing loads that isn't text: no media uploads, no embeds, no feed
  tracking.

## Stack

- **Client:** React + Vite
- **Server:** Node.js, Express, Mongoose (MongoDB)
- **Auth:** JWT, bcrypt-hashed passwords

## Features

- Register / login with hashed passwords and a signed JWT
- Post, filter by category, and react to posts
- Posts are tied to the authenticated user — you can't post as anyone else
- Per-post byte-size badge and a live character counter while composing

## Running locally

**Server:**

```bash
cd server
npm install
cp .env.example .env   # then fill in MONGO_URI and JWT_SECRET
npm run dev             # http://localhost:5000
```

**Client** (in a separate terminal):

```bash
cd client
npm install
npm run dev             # http://localhost:3000, proxies /api to the server
```

## Deploying

Same pattern as [BuildAI](../buildAI): MongoDB Atlas for the database,
Render for the Express API, Vercel for the Vite frontend.

1. Create a free MongoDB Atlas cluster (or a new database in an existing
   one) and copy its connection string into `MONGO_URI`.
2. Deploy `server/` to Render as a Node web service. Set `MONGO_URI`,
   `JWT_SECRET` (a long random string), and `FRONTEND_URL` (your Vercel
   URL, once you have it — this locks down CORS) as environment
   variables.
3. Deploy `client/` to Vercel:
   ```bash
   cd client
   npm install -g vercel   # if not already installed
   vercel login
   vercel                  # first deploy (creates the project)
   vercel --prod
   ```
4. Point the client's `/api` requests at the Render URL in production
   (see `vite.config.js` for the local dev proxy) and redeploy once both
   sides are live.

## Notes

- A `photo` post category existed in an earlier version as a placeholder
  but had no actual image upload behind it, so it was removed rather than
  shipped as a dead end. Real media support (kept deliberately
  lightweight — client-side compression before upload) is a natural v2.
