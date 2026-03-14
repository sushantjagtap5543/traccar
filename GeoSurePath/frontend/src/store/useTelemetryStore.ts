import { create } from 'zustand';

export interface VehiclePosition {
  id: string;
  vehicleId: string;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  status: 'moving' | 'idle' | 'offline' | 'alert';
  updatedAt: string;
}

interface TelemetryState {
  positions: Record<string, VehiclePosition>;
  updatePosition: (position: VehiclePosition) => void;
  setPositions: (positions: VehiclePosition[]) => void;
}

export const useTelemetryStore = create<TelemetryState>((set) => ({
  positions: {},
  updatePosition: (position) =>
    set((state) => ({
      positions: { ...state.positions, [position.vehicleId]: position },
    })),
  setPositions: (positions) =>
    set(() => {
      const posMap: Record<string, VehiclePosition> = {};
      positions.forEach((p) => {
        posMap[p.vehicleId] = p;
      });
      return { positions: posMap };
    }),
}));
