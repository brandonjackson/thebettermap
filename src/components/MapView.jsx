import { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP_STYLE } from '../config';
import './MapView.css';

const MARKER_COLORS = {
  opportunity: '#C45B4A',
  vision: '#5B7FC4',
  celebration: '#2D6A4F',
};

export default function MapView({ center, zoom = 14, markers = [], onMoveEnd, onMarkerClick, showBullseye = false, onBullseyeMove }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: center,
      zoom: zoom,
      attributionControl: true,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('moveend', () => {
      if (onMoveEnd) {
        const bounds = map.getBounds();
        onMoveEnd({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
          center: [map.getCenter().lng, map.getCenter().lat],
        });
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add new markers
    markers.forEach((item) => {
      const el = document.createElement('div');
      el.className = `map-marker map-marker--${item.type}`;

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([item.lng, item.lat])
        .addTo(mapRef.current);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onMarkerClick?.(item);
      });

      markersRef.current.push(marker);
    });
  }, [markers, onMarkerClick]);

  // Fire initial bounds
  useEffect(() => {
    if (!mapRef.current || !onMoveEnd) return;
    const checkReady = () => {
      if (mapRef.current.loaded()) {
        const bounds = mapRef.current.getBounds();
        onMoveEnd({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
          center: [mapRef.current.getCenter().lng, mapRef.current.getCenter().lat],
        });
      } else {
        mapRef.current.once('load', checkReady);
      }
    };
    checkReady();
  }, [onMoveEnd]);

  const handleBullseyeCapture = useCallback(() => {
    if (mapRef.current && onBullseyeMove) {
      const c = mapRef.current.getCenter();
      onBullseyeMove({ lat: c.lat, lng: c.lng });
    }
  }, [onBullseyeMove]);

  // Track map movement for bullseye
  useEffect(() => {
    if (!showBullseye || !mapRef.current || !onBullseyeMove) return;
    const map = mapRef.current;
    map.on('moveend', handleBullseyeCapture);
    // Fire initial position
    handleBullseyeCapture();
    return () => {
      map.off('moveend', handleBullseyeCapture);
    };
  }, [showBullseye, handleBullseyeCapture, onBullseyeMove]);

  return (
    <div className="map-container" ref={containerRef}>
      {showBullseye && (
        <div className="bullseye-overlay">
          <div className="bullseye-ring bullseye-ring--outer" />
          <div className="bullseye-ring bullseye-ring--inner" />
          <div className="bullseye-dot" />
        </div>
      )}
    </div>
  );
}
