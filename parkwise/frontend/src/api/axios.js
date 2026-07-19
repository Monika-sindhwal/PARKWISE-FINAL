import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Attach the JWT to every request automatically, if we have one stored
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("parkwise_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the backend ever says our token is invalid/expired, log the user out
// cleanly instead of leaving them stuck on a broken screen.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("parkwise_token");
      localStorage.removeItem("parkwise_user");
    }
    return Promise.reject(error);
  }
);

export default api;
