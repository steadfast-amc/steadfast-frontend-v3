import axios from "axios";

// Deliberately separate from lib/api.ts. The shared `api` instance attaches
// a JWT header to every request and redirects to /login on any 401 — both
// of which actively break the QR verification flow:
//   1. If a client happens to be logged in on the same browser, their token
//      would leak into a request that's supposed to be anonymous.
//   2. The verification page is used by people who are NOT logged in, by
//      design — a stray 401 anywhere would bounce them to /login mid-flow.
// This instance has neither behavior. Use it only on VerifyJob.tsx.
export const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});
