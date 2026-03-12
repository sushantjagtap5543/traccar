import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { useEffect, useMemo } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { map } from '../core/MapView';
import { findFonts, geofenceToFeature, geometryToArea } from '../core/mapUtil';
import { errorsActions, geofencesActions } from '../../store';
import { useCatchCallback } from '../../reactHelper';
import drawTheme from '../draw/theme';
import { useTranslation } from '../../common/components/LocalizationProvider';
import fetchOrThrow from '../../common/util/fetchOrThrow';
import { Snackbar, Alert } from '@mui/material';

import { CircleMode } from 'mapbox-gl-draw-circle';
import * as DrawRectangleNamespace from 'mapbox-gl-draw-rectangle-mode';

const DrawRectangle = DrawRectangleNamespace.default || DrawRectangleNamespace;

const MapGeofenceDirect = ({ onSelect }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const t = useTranslation();

  const draw = useMemo(
    () =>
      new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          line_string: true,
          trash: true,
        },
        modes: {
          ...MapboxDraw.modes,
          draw_circle: CircleMode,
          draw_rectangle: DrawRectangle,
        },
        userProperties: true,
        styles: [
          ...drawTheme,
          {
            id: 'gl-draw-title',
            type: 'symbol',
            filter: ['all'],
            layout: {
              'text-field': '{user_name}',
              'text-font': findFonts(map),
              'text-size': 12,
            },
            paint: {
              'text-halo-color': 'white',
              'text-halo-width': 1,
            },
          },
        ],
      }),
    [],
  );

  const geofences = useSelector((state) => state.geofences.items);

  const refreshGeofences = useCatchCallback(async () => {
    const response = await fetchOrThrow('/api/geofences');
    dispatch(geofencesActions.refresh(await response.json()));
  }, [dispatch]);

  useEffect(() => {
    refreshGeofences();
    map.addControl(draw, theme.direction === 'rtl' ? 'top-right' : 'top-left');

    // Add custom buttons for Circle and Rectangle to the toolbar
    const toolbar = document.querySelector('.mapboxgl-ctrl-group.mapboxgl-ctrl');
    if (toolbar) {
      if (!document.getElementById('draw-circle-btn')) {
        const circleBtn = document.createElement('button');
        circleBtn.id = 'draw-circle-btn';
        circleBtn.className = 'mapbox-gl-draw_ctrl-draw-btn';
        circleBtn.title = 'Draw a Circle';
        circleBtn.innerHTML = '⭕'; // Temporarily using emoji; ideally an SVG
        circleBtn.onclick = () => draw.changeMode('draw_circle', { initialRadiusInKm: 0.5 });
        toolbar.appendChild(circleBtn);
      }
      if (!document.getElementById('draw-rectangle-btn')) {
        const rectBtn = document.createElement('button');
        rectBtn.id = 'draw-rectangle-btn';
        rectBtn.className = 'mapbox-gl-draw_ctrl-draw-btn';
        rectBtn.title = 'Draw a Rectangle';
        rectBtn.innerHTML = '⬛'; 
        rectBtn.onclick = () => draw.changeMode('draw_rectangle');
        toolbar.appendChild(rectBtn);
      }
      if (!document.getElementById('draw-route-btn')) {
        const routeBtn = document.createElement('button');
        routeBtn.id = 'draw-route-btn';
        routeBtn.className = 'mapbox-gl-draw_ctrl-draw-btn';
        routeBtn.title = 'Draw a Route';
        routeBtn.innerHTML = '🛣️'; 
        routeBtn.onclick = () => draw.changeMode('draw_line_string');
        toolbar.appendChild(routeBtn);
      }
    }

    return () => {
      if (map.hasControl(draw)) {
        map.removeControl(draw);
      }
    };
  }, [refreshGeofences]);

  useEffect(() => {
    const listener = async (event) => {
      const feature = event.features[0];
      const isRoute = feature.geometry.type === 'LineString';
      const newItem = { 
        name: isRoute ? 'Direct Map Route' : 'Direct Map Geofence', 
        area: geometryToArea(feature) 
      };
      draw.delete(feature.id);
      try {
        const response = await fetchOrThrow('/api/geofences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newItem),
        });
        const savedItem = await response.json();
        refreshGeofences();
        if (onSelect) {
          onSelect(savedItem.id);
        }
      } catch (error) {
        dispatch(errorsActions.push(error.message));
      }
    };

    map.on('draw.create', listener);
    return () => map.off('draw.create', listener);
  }, [dispatch]);

  useEffect(() => {
    const listener = async (event) => {
      const feature = event.features[0];
      try {
        await fetchOrThrow(`/api/geofences/${feature.id}`, { method: 'DELETE' });
        refreshGeofences();
        if (onSelect) {
          onSelect(null);
        }
      } catch (error) {
        dispatch(errorsActions.push(error.message));
      }
    };

    map.on('draw.delete', listener);
    return () => map.off('draw.delete', listener);
  }, [dispatch, refreshGeofences]);

  useEffect(() => {
    const listener = async (event) => {
      const feature = event.features[0];
      const item = Object.values(geofences).find((i) => i.id === feature.id);
      if (item) {
        const updatedItem = { ...item, area: geometryToArea(feature) };
        try {
          await fetchOrThrow(`/api/geofences/${feature.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedItem),
          });
          refreshGeofences();
        } catch (error) {
          dispatch(errorsActions.push(error.message));
        }
      }
    };

    map.on('draw.update', listener);
    return () => map.off('draw.update', listener);
  }, [dispatch, geofences, refreshGeofences]);

  useEffect(() => {
    const listener = (event) => {
      if (onSelect) {
        onSelect(event.features.length > 0 ? event.features[0].id : null);
      }
    };

    map.on('draw.selectionchange', listener);
    return () => map.off('draw.selectionchange', listener);
  }, [onSelect]);

  useEffect(() => {
    draw.deleteAll();
    Object.values(geofences).forEach((geofence) => {
      draw.add(geofenceToFeature(theme, geofence));
    });
  }, [geofences]);

  return null;
};

export default MapGeofenceDirect;
