// src/lib/api-client.ts

import axios from 'axios';
import Cookies from 'js-cookie';
import { auth } from './firebase';

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://16-112-99-7.nip.io'
).replace(/\/$/, '');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000,
});

// Request interceptor: Attach Firebase JWT token from auth user or cookie
apiClient.interceptors.request.use(
  async (config) => {
    let token: string | undefined = undefined;

    if (auth.currentUser) {
      try {
        token = await auth.currentUser.getIdToken();
        if (token) {
          Cookies.set('dy_session_token', token, { expires: 7 });
        }
      } catch (e) {
        console.error('Failed to retrieve Firebase ID token:', e);
      }
    }

    if (!token) {
      token = Cookies.get('dy_session_token');
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 (Unauthorized) and 403 (Org Not Approved)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      const status = error.response.status;
      const path = typeof window !== 'undefined' ? window.location.pathname : '';
      const isAuthOrOnboardingRoute =
        path.startsWith('/login') ||
        path.startsWith('/signup') ||
        path.startsWith('/forgot-password') ||
        path.startsWith('/onboarding');

      if (status === 401 && !isAuthOrOnboardingRoute) {
        Cookies.remove('dy_session_token');
        Cookies.remove('dy_session_role');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      } else if (status === 403 && !isAuthOrOnboardingRoute) {
        if (typeof window !== 'undefined') {
          window.location.href = '/onboarding/pending';
        }
      }
    }
    return Promise.reject(error);
  }
);
