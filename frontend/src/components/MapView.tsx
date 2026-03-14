"use client";

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { usePositionsStore } from '@/store/usePositionsStore';

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
}

export function MapView({ center = [78.9629, 20.5937], zoom = 5 }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const { positions } = usePositionsStore();
  const [activeMarkers, setActiveMarkers] = useState<Record<string, maplibregl.Marker>>({});

  useEffect(() => {
    if (map.current) return;
    if (!mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: center,
      zoom: zoom,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      if (!map.current) return;

      map.current.addSource('vehicles', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });

      map.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'vehicles',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 100, '#f1f075', 750, '#f28cb1'],
          'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40]
        }
      });

      map.current.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'vehicles',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12
        }
      });
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    const features = Object.values(positions).map(pos => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [pos.longitude, pos.latitude] },
      properties: { ...pos }
    }));

    const source = map.current.getSource('vehicles') as maplibregl.GeoJSONSource;
    if (source) {
      source.setData({ type: 'FeatureCollection', features: features as any });
    }

    const newMarkers = { ...activeMarkers };

    Object.values(positions).forEach((pos) => {
      if (newMarkers[pos.deviceId]) {
        newMarkers[pos.deviceId].setLngLat([pos.longitude, pos.latitude]);
        const el = newMarkers[pos.deviceId].getElement();
        const icon = el.querySelector('.vehicle-icon') as HTMLElement;
        if (icon) icon.style.transform = `rotate(${pos.course}deg)`;
      } else {
        const el = document.createElement('div');
        el.className = 'vehicle-marker';
        const color = pos.status === 'moving' ? '#10b981' : pos.status === 'idle' ? '#f59e0b' : '#ef4444';
        
        let path = "M12,2L4.5,20.29L5.21,21L12,18L18.79,21L19.5,20.29L12,2Z"; 
        if (pos.attributes?.type === 'truck') {
          path = "M20,8H17V4H3C1.89,4 1,4.89 1,6V17H3A3,3 0 0,0 6,20A3,3 0 0,0 9,17H15A3,3 0 0,0 18,20A3,3 0 0,0 21,17H23V12L20,8M6,18.5A1.5,1.5 0 0,1 4.5,17A1.5,1.5 0 0,1 6,15.5A1.5,1.5 0 0,1 7.5,17A1.5,1.5 0 0,1 6,18.5M17,12V9.5H19.5L21.47,12H17M18,18.5A1.5,1.5 0 0,1 16.5,17A1.5,1.5 0 0,1 18,15.5A1.5,1.5 0 0,1 19.5,17A1.5,1.5 0 0,1 18,18.5Z";
        } else if (pos.attributes?.type === 'bike') {
          path = "M15.5,5.5L11,9.41V7H7V11H5V7A2,2 0 0,1 7,5H11V3.5A1.5,1.5 0 0,1 12.5,2C13.33,2 14,2.67 14,3.5C14,4.28 13.4,4.92 12.64,5H15.5V5.5Z";
        }
        
        el.innerHTML = `
          <div class="vehicle-icon" style="transform: rotate(${pos.course}deg); color: ${color}; filter: drop-shadow(0 0 5px ${color}44);">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
              <path d="${path}" />
            </svg>
          </div>
        `;

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([pos.longitude, pos.latitude])
          .addTo(map.current!);
        newMarkers[pos.deviceId] = marker;
      }
    });

    setActiveMarkers(newMarkers);
  }, [positions]);

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainer} className="map-container w-full h-full" />
      
      {/* Search Bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-full max-w-md px-4">
        <div className="glass flex items-center p-2 rounded-2xl border border-border gap-2">
            <input 
                type="text" 
                placeholder="Search vehicle name or imei..." 
                className="flex-1 bg-transparent border-none outline-none text-xs px-4 text-white"
                onChange={(e) => {
                    const term = e.target.value.toLowerCase();
                    const found = Object.values(positions).find(p => p.name?.toLowerCase().includes(term) || p.imei?.includes(term));
                    if (found && map.current) {
                        map.current.flyTo({ center: [found.longitude, found.latitude], zoom: 16 });
                    }
                }}
            />
        </div>
      </div>

      <div className="absolute top-4 left-4 glass p-4 rounded-xl z-10 shadow-premium border border-border">
        <h3 className="text-sm font-bold mb-2 uppercase tracking-tighter italic">Fleet Pulse</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
            <span className="text-[10px] font-bold uppercase">Moving: {Object.values(positions).filter(p => p.status === 'moving').length}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_10px_#f59e0b]" />
            <span className="text-[10px] font-bold uppercase text-muted">Idle: {Object.values(positions).filter(p => p.status === 'idle').length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
