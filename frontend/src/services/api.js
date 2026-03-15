import axios from "axios";

const API = axios.create({
  baseURL: "/api", // Proxied in vite.config.js or absolute URL for dev
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
