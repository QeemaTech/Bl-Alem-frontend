import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || '/api';

function resolveApiOrigin(): string {
  if (import.meta.env.VITE_ASSETS_URL) return import.meta.env.VITE_ASSETS_URL;
  if (API_URL.startsWith('http')) return API_URL.replace(/\/api\/?$/, '');
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

export const API_ORIGIN = resolveApiOrigin();

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('bi_alem_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) localStorage.removeItem('bi_alem_token');
    return Promise.reject(error);
  },
);
