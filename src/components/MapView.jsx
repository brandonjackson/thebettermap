import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP_STYLE } from '../config';
import './MapView.css';

export default function MapView({ center, zoom = 14, markers = [], onMoveEnd, onMarkerClick, showBullseye = false, onBullseyeMove }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  // Keep callback refs current so event handlers never go stale
  const onMoveEndRef = useRef(onMoveEnd);
  const onMarkerClickRef = useRef(onMarkerClick);
  const onBullseyeMoveRef = useRef(onBullseyeMove);
  const showBullseyeRef = useRef(showBullseye);
  useEffect(() => { onMoveEndRef.current = onMoveEnd; }, [onMoveEnd]);
  useEffect(() => { onMarkerClickRef.current = onMarkerClick; }, [onMarkerClick]);
  useEffect(() => { onBullseyeMoveRef.current = onBullseyeMove; }, [onBullseyeMove]);
  useEffect(() => { showBullseyeRef.current = showBullseye; }, [showBullseye]);

  // Initialize map once
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
      const bounds = map.getBounds();
      onMoveEndRef.current?.({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
        center: [map.getCenter().lng, map.getCenter().lat],
      });
      if (showBullseyeRef.current) {
        const c = map.getCenter();
        onBullseyeMoveRef.current?.({ lat: c.lat, lng: c.lng });
      }
    });

    map.on('load', () => {
      const bounds = map.getBounds();
      onMoveEndRef.current?.({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
        center: [map.getCenter().lng, map.getCenter().lat],
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fire bullseye position when it first becomes visible
  useEffect(() => {
    if (showBullseye && mapRef.current) {
      const c = mapRef.current.getCenter();
      onBullseyeMoveRef.current?.({ lat: c.lat, lng: c.lng });
    }
  }, [showBullseye]);

  // Update markers
  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    markers.forEach((item) => {
      const el = document.createElement('div');
      el.className = `map-marker map-marker--${item.type}`;

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([item.lng, item.lat])
        .addTo(mapRef.current);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onMarkerClickRef.current?.(item);
      });

      markersRef.current.push(marker);
    });
  }, [markers]);

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
