"use client";

import React from 'react';
import { useTelemetryStore } from '@/store/useTelemetryStore';
import { Car, MapPin, Gauge, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export function VehicleList() {
  const { positions } = useTelemetryStore();
  const vehicles = Object.values(positions);

  return (
    <div className="flex flex-col h-full bg-card/50 glass border-l border-border">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Active Vehicles ({vehicles.length})</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {vehicles.length === 0 ? (
          <div className="p-8 text-center text-muted">
            <Car className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-xs">No active vehicles</p>
          </div>
        ) : (
          vehicles.map((vehicle) => (
            <div 
              key={vehicle.id} 
              className="p-4 border-b border-border hover:bg-white/5 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{vehicle.vehicleId}</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                  vehicle.status === 'moving' ? "bg-accent/20 text-accent" :
                  vehicle.status === 'idle' ? "bg-amber-500/20 text-amber-500" :
                  "bg-slate-500/20 text-slate-500"
                )}>
                  {vehicle.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-[11px] text-muted">
                <div className="flex items-center gap-1">
                  <Gauge className="w-3 h-3" />
                  {vehicle.speed} km/h
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {vehicle.latitude.toFixed(4)}, {vehicle.longitude.toFixed(4)}
                </div>
                <div className="flex items-center gap-1 col-span-2">
                  <Clock className="w-3 h-3" />
                  Last update: {new Date(vehicle.updatedAt).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
