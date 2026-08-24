import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept request to attach Bearer JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pawsome_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept response to handle auth expired
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect if checking health or me
      if (
        !error.config.url.includes('/auth/me') &&
        !error.config.url.includes('/auth/login')
      ) {
        localStorage.removeItem('pawsome_token');
        localStorage.removeItem('pawsome_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
