// frontend/src/api.js
// Local dev: empty string, so requests stay relative and go through Vite's
// dev proxy (see vite.config.js). Production build: set VITE_API_URL to the
// deployed backend's URL (e.g. in your host's env var settings) so requests
// go straight there instead — there's no dev proxy once this is built.
const BASE = import.meta.env.VITE_API_URL || "";

export function setToken(t) {
  localStorage.setItem("token", t);
}
export function getToken() {
  return localStorage.getItem("token");
}
export function clearToken() {
  localStorage.removeItem("token");
}

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!headers["Content-Type"] && typeof options.body === "string") {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  // throw readable errors
  if (!res.ok) {
    let message = res.statusText;
    try { const data = await res.json(); message = data?.error || message; } catch { /* body wasn't JSON — keep statusText */ }
    if (res.status === 401) {                    // ★ auto-logout on unauthorized
      try { clearToken(); } catch { /* localStorage unavailable — nothing to clean up */ }
    }
    throw new Error(`${res.status} ${message}`);
  }

  // handle empty bodies gracefully
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

export const api = {
  // auth
  register:        (body) => request("/api/auth/register",        { method: "POST", body: JSON.stringify(body) }),
  login:           (body) => request("/api/auth/login",           { method: "POST", body: JSON.stringify(body) }),
  me:              ()     => request("/api/auth/me",              { method: "GET"  }),
  forgotPassword:  (body) => request("/api/auth/forgot-password", { method: "POST", body: JSON.stringify(body) }),
  resetPassword:   (body) => request("/api/auth/reset-password",  { method: "POST", body: JSON.stringify(body) }),

  // cases (patient)
  createCase:  (body)     => request("/api/cases",              { method: "POST",  body: JSON.stringify(body) }),
  myCases:     ()         => request("/api/cases/mine",         { method: "GET"   }),
  updateCase:  (id, body) => request(`/api/cases/${id}`,        { method: "PATCH",  body: JSON.stringify(body) }),
  deleteCase:  (id)       => request(`/api/cases/${id}`,        { method: "DELETE" }),
  caseHistory: (id)       => request(`/api/cases/${id}/history`,{ method: "GET"    }),

  // users
  doctors: () => request("/api/users/doctors", { method: "GET"  }),
  consent: () => request("/api/users/consent", { method: "POST" }),

  // appointments
  createAppt:  (body) => request("/api/appointments",         { method: "POST", body: JSON.stringify(body) }),
  myAppts:     ()     => request("/api/appointments/mine",    { method: "GET"  }),
  doctorAppts: ()     => request("/api/appointments/doctor",  { method: "GET"  }),
  updateAppt:  (id, body) => request(`/api/appointments/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

  // doctor (legacy inbox + actions)
  doctorInbox:  ()         => request("/api/cases/inbox",              { method: "GET"   }),
  claimCase:    (id)       => request(`/api/cases/${id}/claim`,        { method: "POST"  }),
  doctorReview: (id, body) => request(`/api/cases/${id}/doctor-review`,{ method: "PATCH", body: JSON.stringify(body) }),

  // doctor boards
  doctorInboxBoard:   () => request("/api/cases/board/inbox",   { method: "GET" }),
  doctorMineBoard:    () => request("/api/cases/board/mine",    { method: "GET" }),
  doctorCollabBoard:  () => request("/api/cases/board/collab",  { method: "GET" }),
  doctorClaimedBoard: () => request("/api/cases/board/claimed", { method: "GET" }),

  // collaboration toggle
  setCollab: (id, body) => request(`/api/cases/${id}/collab`, {
    method: "PATCH",
    body: JSON.stringify(body),
  }),
};

export async function uploadImage(file) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const fd = new FormData();
  fd.append("image", file);

  const res = await fetch(`${BASE}/api/upload/image`, { method: "POST", headers, body: fd });
  if (!res.ok) throw new Error(await res.text());
  return res.json(); // { url, public_id } 
}