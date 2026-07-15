import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Attach the JWT to every request automatically once logged in — no
// controller/page ever has to remember to add the header itself.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("steadfast_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A 401 from any endpoint means the token is invalid/expired — bounce to
// login rather than showing a broken authenticated page.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("steadfast_token");
      localStorage.removeItem("steadfast_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
