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

      // Cluster circle layer
      map.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'vehicles',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': ['step', ['get', 'point_count'], '#10b981', 10, '#f59e0b', 20, '#ef4444'],
          'circle-radius': ['step', ['get', 'point_count'], 20, 10, 30, 20, 40],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      });

      // Cluster count text
      map.current.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'vehicles',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-size': 12,
          'text-allow-overlap': true
        },
        paint: {
          'text-color': '#ffffff'
        }
      });

      // Individual Vehicle Layer
      map.current.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'vehicles',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#11b4da',
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      });

      // Add click handler for clusters
      map.current.on('click', 'clusters', (e) => {
        if (!map.current) return;
        const features = map.current.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        const clusterId = features[0].properties!.cluster_id;
        (map.current.getSource('vehicles') as any).getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
          if (err) return;
          map.current!.easeTo({
            center: (features[0].geometry as any).coordinates,
            zoom: zoom
          });
        });
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
      properties: { 
        id: pos.deviceId,
        name: pos.name,
        status: pos.status,
        speed: pos.speed
      }
    }));

    const source = map.current.getSource('vehicles') as maplibregl.GeoJSONSource;
    if (source) {
      source.setData({ type: 'FeatureCollection', features: features as any });
    }
  }, [positions]);

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainer} className="map-container w-full h-full" />
      
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
        <h3 className="text-sm font-bold mb-2 uppercase tracking-tighter italic">Fleet Cluster Active</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
            <span className="text-[10px] font-bold uppercase">Moving: {Object.values(positions).filter(p => p.status === 'moving').length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
