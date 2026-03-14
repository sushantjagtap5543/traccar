"use client";

import React, { useEffect, useRef, useState } from 'react';
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
  const { positions } = useTelemetryStore();
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

      // Add clustering source
      map.current.addSource('vehicles', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });

      // Cluster Circles
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

      // Cluster Count Text
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

    // Individual vehicle markers (only if not clustered or as high-level overlay)
    // For simplicity in this demo, we'll keep the marker logic but filter by zoom or use unclustered layer
    // Updating markers manually to support rotation and custom HTML
    const newMarkers = { ...activeMarkers };

    Object.values(positions).forEach((pos) => {
      if (newMarkers[pos.vehicleId]) {
        newMarkers[pos.vehicleId].setLngLat([pos.longitude, pos.latitude]);
        const el = newMarkers[pos.vehicleId].getElement();
        const icon = el.querySelector('.vehicle-icon') as HTMLElement;
        if (icon) icon.style.transform = `rotate(${pos.course}deg)`;
      } else {
        const el = document.createElement('div');
        el.className = 'vehicle-marker';
        const color = pos.status === 'moving' ? '#10b981' : pos.status === 'idle' ? '#f59e0b' : '#ef4444';
        
        let path = "M12,2L4.5,20.29L5.21,21L12,18L18.79,21L19.5,20.29L12,2Z"; // Default arrow
        if (pos.attributes?.type === 'truck') {
          path = "M18,18H6V6H18M18,4H6C4.9,4 4,4.9 4,6V18C4,19.1 4.9,20 6,20H18C19.1,20 20,19.1 20,18V6C20,4.9 19.1,4 18,4Z";
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
        newMarkers[pos.vehicleId] = marker;
      }
    });

    setActiveMarkers(newMarkers);
  }, [positions]);

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainer} className="map-container" />
      <div className="absolute top-4 left-4 glass p-4 rounded-xl z-10 shadow-premium">
        <h3 className="text-sm font-bold mb-2">Fleet Overview</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-accent animate-pulse" />
            <span className="text-xs font-medium">Moving: {Object.values(positions).filter(p => p.status === 'moving').length}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-xs font-medium">Idle: {Object.values(positions).filter(p => p.status === 'idle').length}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-slate-500" />
            <span className="text-xs font-medium">Offline: {Object.values(positions).filter(p => p.status === 'offline').length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
