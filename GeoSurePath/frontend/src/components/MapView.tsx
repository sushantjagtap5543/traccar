"use client";

import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTelemetryStore } from '@/store/useTelemetryStore';

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
}

export function MapView({ center = [78.9629, 20.5937], zoom = 5 }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<Record<string, maplibregl.Marker>>({});
  const { positions } = useTelemetryStore();

  useEffect(() => {
    if (map.current) return;
    if (!mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json', // Use a free style or MapTiler/Mapbox
      center: center,
      zoom: zoom,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;

    // Update or add markers for all positions
    Object.values(positions).forEach((pos) => {
      if (markers.current[pos.vehicleId]) {
        // Update existing marker
        markers.current[pos.vehicleId].setLngLat([pos.longitude, pos.latitude]);
        
        // Update rotation if marker element has a specific icon
        const el = markers.current[pos.vehicleId].getElement();
        const icon = el.querySelector('.vehicle-icon') as HTMLElement;
        if (icon) {
          icon.style.transform = `rotate(${pos.course}deg)`;
        }
      } else {
        // Create new marker
        const el = document.createElement('div');
        el.className = 'vehicle-marker';
        
        const color = 
          pos.status === 'moving' ? '#10b981' : 
          pos.status === 'idle' ? '#f59e0b' : 
          pos.status === 'alert' ? '#ef4444' : '#64748b';

        el.innerHTML = `
          <div class="vehicle-icon" style="transform: rotate(${pos.course}deg); color: ${color};">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M12,2L4.5,20.29L5.21,21L12,18L18.79,21L19.5,20.29L12,2Z" />
            </svg>
          </div>
        `;

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([pos.longitude, pos.latitude])
          .addTo(map.current!);

        markers.current[pos.vehicleId] = marker;
      }
    });

    // Optional: Auto-pan to selected vehicle if focus implemented
  }, [positions]);

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainer} className="map-container" />
      <div className="absolute top-4 left-4 glass p-3 rounded-lg z-10">
        <p className="text-xs font-semibold text-muted mb-1 uppercase tracking-wider">Status</p>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <span className="text-xs">Moving</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-xs">Idle</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-500" />
            <span className="text-xs">Offline</span>
          </div>
        </div>
      </div>
    </div>
  );
}
