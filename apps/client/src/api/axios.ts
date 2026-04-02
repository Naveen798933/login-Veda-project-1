import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // Required for refresh tokens in cookies
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('[Axios] Request:', {
    url: config.url,
    method: config.method,
    hasToken: !!token,
    baseURL: config.baseURL
  });
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log('[Axios] Response success:', {
      url: response.config.url,
      status: response.status,
      hasData: !!response.data
    });
    return response;
  },
  async (error) => {
    console.error('[Axios] Response error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message
    });
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        console.log('[Axios] Attempting token refresh...');
        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        useAuthStore.getState().updateAccessToken(data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        console.log('[Axios] Token refreshed, retrying request...');
        return api(originalRequest);
      } catch (err) {
        console.error('[Axios] Token refresh failed, logging out');
        useAuthStore.getState().logout();
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
