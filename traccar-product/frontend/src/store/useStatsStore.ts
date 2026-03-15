import { create } from 'zustand';
import axios from 'axios';

interface AdminStats {
  totalVehicles: number;
  onlineVehicles: number;
  offlineVehicles: number;
  activeClients: number;
  alertsToday: number;
  distanceToday: number;
}

interface StatsState {
  adminStats: AdminStats | null;
  loading: boolean;
  fetchAdminStats: (token: string) => Promise<void>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const useStatsStore = create<StatsState>((set) => ({
  adminStats: null,
  loading: false,
  fetchAdminStats: async (token: string) => {
    set({ loading: true });
    try {
      const response = await axios.get(`${API_URL}/stats/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ adminStats: response.data, loading: false });
    } catch (e) {
      console.error('Failed to fetch stats', e);
      set({ loading: false });
    }
  }
}));
