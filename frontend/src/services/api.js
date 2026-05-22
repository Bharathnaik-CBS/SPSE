import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 15000,
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const payload = error.response?.data;
    const normalizedError = new Error(payload?.message || error.message || 'Request failed');
    normalizedError.status = error.response?.status;
    normalizedError.errors = payload?.errors;
    normalizedError.data = payload;
    throw normalizedError;
  }
);

export default api;
