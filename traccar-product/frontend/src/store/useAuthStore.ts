import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

interface User {
  id: string;
  mobile: string;
  role: string;
  name?: string;
  clientId?: string;
  email?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  loading: boolean;
  register: (mobile: string) => Promise<void>;
  verifyOtp: (mobile: string, code: string) => Promise<void>;
  login: (mobile: string, password?: string) => Promise<void>;
  completeProfile: (data: { name: string; email: string; company: string; address: string; password?: string }) => Promise<void>;
  logout: () => void;
}

const getApiUrl = () => {
  // @ts-ignore
  const envUrl = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_API_URL : null;
  if (envUrl) return envUrl;
  
  if (typeof window !== 'undefined') {
    // Check if we are on a specific port or use 8082 as default backend port
    const port = window.location.port === '3000' ? '8083' : '8082'; 
    return `${window.location.protocol}//${window.location.hostname}:${port}/api`;
  }
  return '/api';
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      loading: false,
      register: async (mobile) => {
        set({ loading: true });
        try {
          const baseUrl = getApiUrl();
          await axios.post(`${baseUrl}/auth/register`, { mobile });
          set({ loading: false });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },
      verifyOtp: async (mobile, code) => {
        set({ loading: true });
        try {
          const baseUrl = getApiUrl();
          const res = await axios.post(`${baseUrl}/auth/verify`, { mobile, code });
          const { accessToken } = res.data;
          
          // Decode JWT to get user info safely
          const base64Url = accessToken.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(window.atob(base64));
          
          set({ 
            token: accessToken, 
            user: { 
              id: payload.sub, 
              mobile: payload.mobile, 
              role: payload.role,
              clientId: payload.clientId
            },
            loading: false 
          });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },
      login: async (mobile, password) => {
        set({ loading: true });
        try {
          const baseUrl = getApiUrl();
          const res = await axios.post(`${baseUrl}/auth/login`, { mobile, password });
          const { accessToken } = res.data;
          
          const base64Url = accessToken.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(window.atob(base64));
          
          set({ 
            token: accessToken, 
            user: { 
              id: payload.sub, 
              mobile: payload.mobile, 
              role: payload.role,
              clientId: payload.clientId
            },
            loading: false 
          });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },
      completeProfile: async (profileData) => {
        const state = get();
        if (!state.token) throw new Error('Session expired. Please verify your mobile again.');
        
        set({ loading: true });
        try {
          const baseUrl = getApiUrl();
          const res = await axios.put(`${baseUrl}/auth/profile`, profileData, {
            headers: { Authorization: `Bearer ${state.token}` }
          });
          set({ user: res.data, loading: false });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'geosurepath-auth-v2', // Changed name to avoid conflicts with old storage
    }
  )
);

