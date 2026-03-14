"use client";

import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/useAuthStore';
import { useTelemetryStore } from '@/store/useTelemetryStore';
import { toast } from 'react-toastify';

let socket: Socket | null = null;

export function SocketController() {
  const { token, isAuthenticated } = useAuthStore();
  const { updatePosition } = useTelemetryStore();

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
      return;
    }

    if (!socket) {
      socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001/telemetry', {
        auth: { token },
      });

      socket.on('connect', () => {
        console.log('Connected to telemetry socket');
      });

      socket.on('position_update', (data) => {
        updatePosition(data);
      });

      socket.on('new_alert', (alert) => {
        toast.info(`New Alert: ${alert.message}`, {
          position: "top-right",
          autoClose: 5000,
        });
        // Optionally update an alerts store
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from telemetry socket');
      });
    }

    return () => {
      // Don't necessarily disconnect on every re-render, 
      // but managed by the isAuthenticated check above
    };
  }, [isAuthenticated, token, updatePosition]);

  return null; // This component doesn't render anything
}
