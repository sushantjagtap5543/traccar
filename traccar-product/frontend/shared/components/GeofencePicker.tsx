"use client";

import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface GeofencePickerProps {
  lat: number;
  lng: number;
  radius: number;
  onChange: (lat: number, lng: number) => void;
}

export function GeofencePicker({ lat, lng, radius, onChange }: GeofencePickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);
  const circleSource = useRef<string>('geofence-circle');

  useEffect(() => {
    if (map.current) return;
    if (!mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [lng || 78.9629, lat || 20.5937],
      zoom: 13,
    });

    map.current.on('load', () => {
       if (!map.current) return;

       // Add circle source
       map.current.addSource(circleSource.current, {
         type: 'geojson',
         data: createGeoJSONCircle([lng, lat], radius)
       });

       map.current.addLayer({
         id: 'circle-fill',
         type: 'fill',
         source: circleSource.current,
         paint: {
           'fill-color': '#3b82f6',
           'fill-opacity': 0.2
         }
       });

       map.current.addLayer({
         id: 'circle-outline',
         type: 'line',
         source: circleSource.current,
         paint: {
           'line-color': '#3b82f6',
           'line-width': 2
         }
       });

       marker.current = new maplibregl.Marker({ draggable: true })
         .setLngLat([lng || 78.9629, lat || 20.5937])
         .addTo(map.current);

       marker.current.on('dragend', () => {
         const lngLat = marker.current?.getLngLat();
         if (lngLat) {
           onChange(lngLat.lat, lngLat.lng);
         }
       });

       map.current.on('click', (e) => {
         const { lng: clickLng, lat: clickLat } = e.lngLat;
         marker.current?.setLngLat([clickLng, clickLat]);
         onChange(clickLat, clickLng);
       });
    });

    return () => map.current?.remove();
  }, []);

  useEffect(() => {
    if (!map.current || !map.current.getStyle()) return;
    
    // Update marker position if changed externally
    marker.current?.setLngLat([lng, lat]);

    // Update circle
    const source = map.current.getSource(circleSource.current) as maplibregl.GeoJSONSource;
    if (source) {
      source.setData(createGeoJSONCircle([lng, lat], radius));
    }
  }, [lat, lng, radius]);

  const createGeoJSONCircle = (center: [number, number], radiusInMeters: number, points: number = 64): any => {
    const coords = {
      latitude: center[1],
      longitude: center[0]
    };
    const km = radiusInMeters / 1000;
    const ret = [];
    const distanceX = km / (111.32 * Math.cos(coords.latitude * Math.PI / 180));
    const distanceY = km / 110.574;

    for (let i = 0; i < points; i++) {
      const theta = (i / points) * (2 * Math.PI);
      const x = distanceX * Math.cos(theta);
      const y = distanceY * Math.sin(theta);
      ret.push([coords.longitude + x, coords.latitude + y]);
    }
    ret.push(ret[0]);

    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [ret]
      }
    };
  };

  return (
    <div className="w-full h-[300px] rounded-xl overflow-hidden border border-border relative">
      <div ref={mapContainer} className="w-full h-full" />
      <div className="absolute top-2 left-2 glass px-3 py-1.5 rounded-lg text-[9px] font-bold text-white uppercase pointer-events-none">
        Click or drag to position
      </div>
    </div>
  );
}
