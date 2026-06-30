import axios from 'axios';
import {
  AUTH_TOKEN_KEY,
  clearAuthSession,
  notifySessionExpired,
} from '../utils/authStorage';

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
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      clearAuthSession();
      notifySessionExpired();
    }
    return Promise.reject(error);
  },
);
