import { create } from 'zustand';
import axios from 'axios';

interface User {
  id: string;
  name: string;
  mobile: string;
  role: 'ADMIN' | 'USER';
  email?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (mobile: string, password: string) => Promise<void>;
  logout: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,
  login: async (mobile, password) => {
    set({ loading: true });
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { mobile, password });
      const { user, token } = response.data;
      set({ user, token, loading: false });
      // In a real app, we might save to localStorage here
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth-token', token);
      }
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },
  logout: () => {
    set({ user: null, token: null });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-token');
    }
  },
}));
