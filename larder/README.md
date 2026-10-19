# Larder

A recipe search app with a pantry that remembers. Search for a recipe, get
its full ingredient list, and tick off what you already have — olive oil,
butter, that half-used bottle of red wine vinegar. Larder remembers what
you've ticked, so the next time you open a new recipe, the staples you
always have on hand are already checked off, and the shopping list you
copy out only ever has what's actually missing.

**The clever bit:** pantry state isn't tied to one recipe. It's a
per-user, per-ingredient record that persists across sessions — tick
"olive oil" once and every future recipe treats it as something you own,
until you explicitly untick it because you've run out.

## Stack

- **Client:** React + Vite
- **Server:** Node.js, Express, Mongoose (MongoDB)
- **Auth:** JWT, bcrypt-hashed passwords
- **Recipe data:** [Spoonacular API](https://spoonacular.com/food-api)

## Features

- Register / login with hashed passwords and a signed JWT
- Search recipes by name, view full ingredients and instructions
- Tick ingredients you already have — saved per-user, not per-recipe
- A dedicated pantry view to manage staples directly, independent of any
  one recipe
- "Copy shopping list" copies only the ingredients you haven't ticked

## Design notes

- An ingredient you've never seen before is unticked by default — absence
  of a pantry record means "unknown," never "you don't have this" or "you
  do." The UI never guesses on your behalf.
- Ingredient names are normalized (lowercased, trimmed) so "Olive Oil" and
  "olive oil" from two different recipes match the same pantry record.
- The Spoonacular API key lives only on the server and is never exposed to
  the client — all recipe requests are proxied through the Express API.

## Running locally

**Server:**

```bash
cd server
npm install
cp .env.example .env   # then fill in MONGO_URI, JWT_SECRET, and SPOONACULAR_API_KEY
npm run dev             # http://localhost:5000
```

Get a free Spoonacular API key at
[spoonacular.com/food-api](https://spoonacular.com/food-api/console#Dashboard),
then paste it into `server/.env` as `SPOONACULAR_API_KEY`. `MONGO_URI`
defaults to a local MongoDB instance if left unset.

**Client** (in a separate terminal):

```bash
cd client
npm install
npm run dev             # http://localhost:5173, proxies /api to the server
```

## Deploying

Same pattern as [Acacia](../acacia) and [BuildAI](../buildAI): MongoDB
Atlas for the database, Render for the Express API, Vercel for the Vite
frontend.

1. Create a new database (and a dedicated database user) in the shared
   MongoDB Atlas cluster, and copy its connection string into `MONGO_URI`.
2. Deploy `server/` to Render as a Node web service. Set `MONGO_URI`,
   `JWT_SECRET`, `SPOONACULAR_API_KEY`, and `FRONTEND_URL` (your Vercel
   URL, once you have it — this locks down CORS) as environment
   variables.
3. Deploy `client/` to Vercel, with `VITE_API_URL` set to the Render
   backend's URL at build time (Vite env vars are baked in at build time,
   not read at runtime — redeploy after changing it).
