# Portfolio

James Nevin's personal portfolio site — a single-page React + Vite app
listing projects, built to be quick to extend.

## Editing content

Everything you'll want to change lives at the top of `src/App.jsx`:

- `PROFILE` — name, title, tagline, bio, email, GitHub, LinkedIn
- `PROJECTS` — one entry per project card (name, description, image,
  tags, live demo link, code link); add a `{ placeholder: true }` entry
  for an empty "coming soon" slot

No other file needs to change to update the content.

## Running locally

```bash
npm install
npm run dev       # http://localhost:5173
```

## Deploying

Same flow as BuildAI — from this folder:

```bash
npm install -g vercel   # if not already installed
vercel login
vercel                  # first deploy (creates the project)
vercel --prod            # production deploy
```
