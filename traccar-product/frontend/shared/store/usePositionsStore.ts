import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface Position {
  deviceId: string;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  status: string;
  attributes: any;
  serverTime: string;
}

interface PositionsState {
  positions: Record<string, Position>;
  socket: Socket | null;
  connect: (token: string) => void;
  disconnect: () => void;
}

export const usePositionsStore = create<PositionsState>((set, get) => ({
  positions: {},
  socket: null,
  connect: (token: string) => {
    if (get().socket) return;
    
    const socket = io(`${process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'}/positions`, {
      auth: { token }
    });

    socket.on('position_update', (data: Position) => {
      set((state) => ({
        positions: {
          ...state.positions,
          [data.deviceId]: data
        }
      }));
    });

    set({ socket });
  },
  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  }
}));
