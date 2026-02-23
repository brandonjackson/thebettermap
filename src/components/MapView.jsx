import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP_STYLE } from '../config';
import { loadImage } from '../services/imageStore';
import './MapView.css';

export default function MapView({ center, zoom = 14, markers = [], onMoveEnd, onMarkerClick, showBullseye = false, onBullseyeMove, onContextMenuAction, flyTo }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const popupRef = useRef(null);
  const [contextMenu, setContextMenu] = useState(null);

  // Keep callback refs current so event handlers never go stale
  const onMoveEndRef = useRef(onMoveEnd);
  const onMarkerClickRef = useRef(onMarkerClick);
  const onBullseyeMoveRef = useRef(onBullseyeMove);
  const showBullseyeRef = useRef(showBullseye);
  const onContextMenuActionRef = useRef(onContextMenuAction);
  useEffect(() => { onMoveEndRef.current = onMoveEnd; }, [onMoveEnd]);
  useEffect(() => { onMarkerClickRef.current = onMarkerClick; }, [onMarkerClick]);
  useEffect(() => { onBullseyeMoveRef.current = onBullseyeMove; }, [onBullseyeMove]);
  useEffect(() => { showBullseyeRef.current = showBullseye; }, [showBullseye]);
  useEffect(() => { onContextMenuActionRef.current = onContextMenuAction; }, [onContextMenuAction]);

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

    map.on('contextmenu', (e) => {
      e.preventDefault();
      if (!onContextMenuActionRef.current) return;
      setContextMenu({
        x: e.point.x,
        y: e.point.y,
        lat: e.lngLat.lat,
        lng: e.lngLat.lng,
      });
    });

    map.on('click', () => {
      setContextMenu(null);
    });

    map.on('movestart', () => {
      setContextMenu(null);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync zoom prop to map when it changes
  useEffect(() => {
    if (mapRef.current && zoom != null) {
      mapRef.current.setZoom(zoom);
    }
  }, [zoom]);

  // Sync center prop to map when it changes
  useEffect(() => {
    if (mapRef.current && center) {
      mapRef.current.setCenter(center);
    }
  }, [center]);

  // Fly/jump to a new center when flyTo prop changes
  useEffect(() => {
    if (flyTo && mapRef.current) {
      mapRef.current.jumpTo({ center: [flyTo.lng, flyTo.lat] });
    }
  }, [flyTo]);

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
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }

    const TYPE_LABELS = { opportunity: 'Improvement', vision: 'Vision', celebration: 'Local Beauty' };
    const TYPE_COLORS = { opportunity: '#CC0C83', vision: '#00A4F2', celebration: '#92C072' };

    markers.forEach((item) => {
      const el = document.createElement('div');
      el.className = `map-marker map-marker--${item.type}`;

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([item.lng, item.lat])
        .addTo(mapRef.current);

      el.addEventListener('click', (e) => {
        e.stopPropagation();

        if (popupRef.current) {
          popupRef.current.remove();
          popupRef.current = null;
        }

        // Build popup content
        const wrapper = document.createElement('div');
        wrapper.className = 'map-tooltip';
        wrapper.style.cursor = 'pointer';

        const typeLabel = TYPE_LABELS[item.type] || item.type;
        const typeColor = TYPE_COLORS[item.type] || '#888';

        // Get thumbnail source
        let thumbnailSrc = item.photoUrl || null;
        if (!thumbnailSrc && item.generatedImages?.length > 0) {
          const idx = item.selectedImageIndex != null ? item.selectedImageIndex : 0;
          thumbnailSrc = item.generatedImages[idx];
        }

        const photoHTML = thumbnailSrc
          ? `<div class="map-tooltip-photo"><img alt="${item.title || ''}" /></div>`
          : `<div class="map-tooltip-photo"><div class="map-tooltip-photo-placeholder" style="border-color:${typeColor}"><span style="color:${typeColor}">${typeLabel}</span></div></div>`;

        wrapper.innerHTML = `
          ${photoHTML}
          <div class="map-tooltip-body">
            <span class="map-tooltip-type" style="color:${typeColor}">${typeLabel}</span>
            <div class="map-tooltip-title">${item.title || ''}</div>
          </div>
        `;

        // Resolve idb: image references
        if (thumbnailSrc) {
          const img = wrapper.querySelector('img');
          if (thumbnailSrc.startsWith('idb:')) {
            loadImage(thumbnailSrc).then((resolved) => {
              if (resolved) img.src = resolved;
            });
          } else {
            img.src = thumbnailSrc;
          }
        }

        wrapper.addEventListener('click', () => {
          onMarkerClickRef.current?.(item);
        });

        const popup = new maplibregl.Popup({ offset: 12, closeButton: false, className: 'map-tooltip-popup' })
          .setLngLat([item.lng, item.lat])
          .setDOMContent(wrapper)
          .addTo(mapRef.current);

        popupRef.current = popup;
      });

      markersRef.current.push(marker);
    });
  }, [markers]);

  function handleContextMenuClick(type) {
    if (contextMenu) {
      onContextMenuActionRef.current?.(type, { lat: contextMenu.lat, lng: contextMenu.lng });
      setContextMenu(null);
    }
  }

  return (
    <div className="map-container" ref={containerRef}>
      {showBullseye && (
        <div className="bullseye-overlay">
          <div className="bullseye-ring bullseye-ring--outer" />
          <div className="bullseye-ring bullseye-ring--inner" />
          <div className="bullseye-dot" />
        </div>
      )}
      {contextMenu && (
        <div className="map-context-menu" style={{ left: contextMenu.x, top: contextMenu.y }}>
          <button className="map-context-menu-item map-context-menu-item--improve" onClick={() => handleContextMenuClick('improve')}>
            <div className="map-context-menu-item-title">Find something to fix</div>
            <div className="map-context-menu-item-desc">Report an issue here</div>
          </button>
          <button className="map-context-menu-item map-context-menu-item--imagine" onClick={() => handleContextMenuClick('imagine')}>
            <div className="map-context-menu-item-title">Imagine something new</div>
            <div className="map-context-menu-item-desc">Envision what could be</div>
          </button>
          <button className="map-context-menu-item map-context-menu-item--celebrate" onClick={() => handleContextMenuClick('celebrate')}>
            <div className="map-context-menu-item-title">Record local beauty</div>
            <div className="map-context-menu-item-desc">Celebrate this place</div>
          </button>
        </div>
      )}
    </div>
  );
}
