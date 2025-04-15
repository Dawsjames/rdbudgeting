// src/services/api.ts
import axios from 'axios'
import type { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'
import { Notify } from 'quasar'

// Determine API base URL with fallbacks
const determineBaseUrl = () => {
  // First try environment variable
  if (process.env.API_URL) {
    return process.env.API_URL;
  }

  // In development, try localhost with standard port
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:6234';
  }

  // If deployed, assume API is at same origin
  return window.location.origin;
};

// Create API instance with config
const api = axios.create({
  baseURL: determineBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000 // 15 seconds timeout
})

// Add request interceptor
api.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // You can add authentication tokens here if needed
    // For example:
    // const token = localStorage.getItem('auth_token');
    // if (token) {
    //   config.headers = config.headers || {};
    //   config.headers.Authorization = `Bearer ${token}`;
    // }

    return config;
  },
  (error: AxiosError) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
)

// Add response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle error responses
    const status = error.response?.status;
    const errorData = error.response?.data as any;
    const errorMessage = errorData?.error || errorData?.message || 'An error occurred';

    // Don't show notification for canceled requests
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    // Handle different error types
    if (!error.response) {
      // Network error or server not reachable
      Notify.create({
        color: 'warning',
        message: 'Network error. Check your connection or try again later.',
        icon: 'signal_wifi_off',
        timeout: 5000
      });
    } else if (status === 401) {
      // Unauthorized
      Notify.create({
        color: 'negative',
        message: 'Session expired. Please log in again.',
        icon: 'logout',
        timeout: 5000
      });
      // You could redirect to login page here
    } else if (status === 403) {
      // Forbidden
      Notify.create({
        color: 'negative',
        message: 'You don\'t have permission to perform this action.',
        icon: 'gpp_bad',
        timeout: 5000
      });
    } else if (status === 404) {
      // Not found
      Notify.create({
        color: 'warning',
        message: 'The requested resource was not found.',
        icon: 'search_off',
        timeout: 3000
      });
    } else if (status! >= 500) {
      // Server error
      Notify.create({
        color: 'negative',
        message: 'Server error. Please try again later.',
        icon: 'error',
        timeout: 5000
      });
    } else {
      // Other errors
      Notify.create({
        color: 'negative',
        message: errorMessage,
        icon: 'error',
        timeout: 3000
      });
    }

    return Promise.reject(error);
  }
);

// Add a method to check API connectivity
api.checkConnectivity = async (): Promise<boolean> => {
  try {
    await api.get('/api/test', { timeout: 5000 });
    return true;
  } catch (error) {
    console.warn('API connectivity check failed:', error);
    return false;
  }
};

export default api;
