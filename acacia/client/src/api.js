// In local dev, Vite's dev server proxies /api to the Express server (see
// vite.config.js), so an empty base works. In production there's no such
// proxy, so VITE_API_URL must point at the deployed backend.
export const API_BASE = import.meta.env.VITE_API_URL || '';
