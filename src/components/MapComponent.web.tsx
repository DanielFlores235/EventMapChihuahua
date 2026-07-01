import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Event, TouristSpot } from '../types';

interface MapComponentProps {
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  userLocation: { latitude: number; longitude: number } | null;
  events: Event[];
  touristSpots?: TouristSpot[];
  onSelectEvent: (event: Event) => void;
  onSelectSpot?: (spot: TouristSpot) => void;
  onMapPress?: (coords: { latitude: number; longitude: number }) => void;
  selectedCoords?: { latitude: number; longitude: number } | null;
}

export default function MapComponent({
  initialRegion,
  userLocation,
  events,
  touristSpots = [],
  onSelectEvent,
  onSelectSpot,
  onMapPress,
  selectedCoords
}: MapComponentProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Genera el contenido HTML para el mapa interactivo usando Leaflet y OpenStreetMap
  const getHtmlContent = () => {
    const centerLat = selectedCoords?.latitude ?? userLocation?.latitude ?? initialRegion.latitude;
    const centerLng = selectedCoords?.longitude ?? userLocation?.longitude ?? initialRegion.longitude;

    // Marcadores para eventos (Dinámicos por categoría)
    const markersScript = events.map(e => `
      var customIcon = L.divIcon({
        className: 'custom-leaflet-icon',
        html: getSvgForCategory(${JSON.stringify(e.category || '')}, false),
        iconSize: [40, 50],
        iconAnchor: [20, 50],
        popupAnchor: [0, -50]
      });
      var marker = L.marker([${e.latitude}, ${e.longitude}], { icon: customIcon }).addTo(map);
      marker.bindPopup(\`
        <div style="font-family: sans-serif; min-width: 150px; color: #1E293B;">
          <h4 style="margin: 0 0 5px 0; color: #3B82F6; font-size: 14px;">📅 \${escapeHtml(${JSON.stringify(e.name)})}</h4>
          \${${JSON.stringify(e.category || '')} ? \`<p style="margin: 0 0 5px 0; font-size: 12px; color: #64748B;">🏷️ \${escapeHtml(${JSON.stringify(e.category || '')})}</p>\` : ''}
          \${${JSON.stringify(e.distance || '')} ? \`<p style="margin: 0 0 8px 0; font-size: 12px; color: #10B981; font-weight: bold;">📍 a \${escapeHtml(${JSON.stringify(e.distance || '')})}</p>\` : ''}
          \${${JSON.stringify(e.date || '')} ? \`<p style="margin: 0 0 8px 0; font-size: 12px; color: #64748B;">\${escapeHtml(${JSON.stringify(e.date || '')})}</p>\` : ''}
          <button onclick="window.parent.postMessage({type: 'SELECT_EVENT', eventId: ${e.id}}, '*')" 
                  style="background-color: #3B82F6; color: white; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold; width: 100%; transition: background-color 0.2s;">
            Ver Evento
          </button>
        </div>
      \`);
    `).join('\n');

    // Marcadores para lugares turísticos (Turismo)
    const spotsScript = touristSpots.map(s => `
      var spotIcon = L.divIcon({
        className: 'custom-leaflet-icon',
        html: getSvgForCategory('', true),
        iconSize: [40, 50],
        iconAnchor: [20, 50],
        popupAnchor: [0, -50]
      });
      var spotMarker = L.marker([${s.latitude}, ${s.longitude}], {icon: spotIcon}).addTo(map);
      spotMarker.bindPopup(\`
        <div style="font-family: sans-serif; min-width: 150px; color: #1E293B;">
          <h4 style="margin: 0 0 5px 0; color: #F59E0B; font-size: 14px;">📸 \${escapeHtml(${JSON.stringify(s.name)})}</h4>
          \${${JSON.stringify(s.description || '')} ? \`<p style="margin: 0 0 5px 0; font-size: 12px; color: #64748B; white-space: normal;">\${escapeHtml(${JSON.stringify(s.description || '')})}</p>\` : ''}
          \${${JSON.stringify(s.start_time || '')} ? \`<p style="margin: 0 0 8px 0; font-size: 12px; color: #64748B;">🕒 \${escapeHtml(${JSON.stringify(s.start_time || '')})} - \${escapeHtml(${JSON.stringify(s.end_time || '')})}</p>\` : ''}
        </div>
      \`);
    `).join('\n');

    // Marcador de ubicación del usuario (azul)
    const userMarkerScript = userLocation ? `
      var userIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });
      L.marker([${userLocation.latitude}, ${userLocation.longitude}], {icon: userIcon}).addTo(map)
        .bindPopup("<b>Tu ubicación actual</b>");
    ` : '';

    // Marcador temporal seleccionado (verde)
    const selectedMarkerScript = selectedCoords ? `
      var selectIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });
      L.marker([${selectedCoords.latitude}, ${selectedCoords.longitude}], {icon: selectIcon}).addTo(map)
        .bindPopup("<b>Ubicación seleccionada</b>").openPopup();
    ` : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
          html, body, #map { height: 100%; margin: 0; padding: 0; width: 100%; background: #F1F5F9; }
          /* Light Mode Popups */
          .leaflet-popup-content-wrapper { 
            background: rgba(255, 255, 255, 0.95); 
            border: 1px solid rgba(0, 0, 0, 0.1);
            border-radius: 12px; 
            box-shadow: 0 8px 32px rgba(0,0,0,0.1); 
            backdrop-filter: blur(10px);
          }
          .leaflet-popup-tip { background: rgba(255, 255, 255, 0.95); border: 1px solid rgba(0, 0, 0, 0.1); border-top: none; border-left: none; }
          .leaflet-container a.leaflet-popup-close-button { color: #64748B; }
          
          /* Custom SVG Pins */
          .custom-leaflet-icon {
            background: none;
            border: none;
          }
          .custom-pin {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            transition: transform 0.2s ease, filter 0.2s ease;
            cursor: pointer;
            width: 40px;
            height: 50px;
          }
          .custom-pin:hover {
            transform: scale(1.15) translateY(-5px);
            filter: drop-shadow(0 0 10px var(--pin-color));
          }
          .pin-head {
            background: var(--pin-color);
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border: 2px solid #FFF;
            display: flex;
            justify-content: center;
            align-items: center;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            z-index: 2;
          }
          .pin-icon {
            font-size: 16px;
            line-height: 1;
          }
          .pin-point {
            width: 0; 
            height: 0; 
            border-left: 8px solid transparent;
            border-right: 8px solid transparent;
            border-top: 14px solid var(--pin-color);
            margin-top: -4px;
            z-index: 1;
            filter: drop-shadow(0 2px 2px rgba(0,0,0,0.3));
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
          function escapeHtml(str) {
            if (!str) return '';
            return str.toString()
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
          }

          function getSvgForCategory(category, isSpot) {
            let color = '#3B82F6';
            let iconContent = '📌';

            if (isSpot) {
              color = '#FBBF24';
              iconContent = '📸';
            } else {
              switch (category) {
                case 'Música': color = '#A855F7'; iconContent = '🎵'; break;
                case 'Deportes': color = '#F97316'; iconContent = '⚽'; break;
                case 'Cultura': color = '#EC4899'; iconContent = '🏛️'; break;
                case 'Tecnología': color = '#06B6D4'; iconContent = '💻'; break;
                default: color = '#EF4444'; iconContent = '🎟️'; break;
              }
            }

            return \`
              <div class="custom-pin" style="--pin-color: \${color};">
                <div class="pin-head">
                  <span class="pin-icon">\${iconContent}</span>
                </div>
                <div class="pin-point"></div>
              </div>
            \`;
          }

          var map = L.map('map', { zoomControl: false }).setView([${centerLat}, ${centerLng}], 14);
          
          L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors © CARTO'
          }).addTo(map);

          window.addEventListener('message', function(event) {
            if(event.data && event.data.type === 'ZOOM_IN') map.zoomIn();
            if(event.data && event.data.type === 'ZOOM_OUT') map.zoomOut();
            if(event.data && event.data.type === 'LOCATE') map.setView([${userLocation?.latitude || centerLat}, ${userLocation?.longitude || centerLng}], 16);
          });

          map.on('click', function(e) {
            window.parent.postMessage({
              type: 'MAP_CLICK',
              latitude: e.latlng.lat,
              longitude: e.latlng.lng
            }, '*');
          });

          ${markersScript}
          ${spotsScript}
          ${userMarkerScript}
          ${selectedMarkerScript}
        </script>
      </body>
      </html>
    `;
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Escuchar el evento de selección de marcador
      if (event.data && event.data.type === 'SELECT_EVENT') {
        const found = events.find(e => e.id === event.data.eventId);
        if (found) {
          onSelectEvent(found);
        }
      }
      // Escuchar el click en el mapa
      else if (event.data && event.data.type === 'MAP_CLICK' && onMapPress) {
        onMapPress({
          latitude: event.data.latitude,
          longitude: event.data.longitude
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [events, onSelectEvent, onMapPress]);

  // Actualizar el contenido del iframe cuando cambien los eventos o selección de coordenadas
  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.srcdoc = getHtmlContent();
    }
  }, [events, userLocation, selectedCoords]);

  return (
    <View style={styles.container}>
      <iframe
        ref={iframeRef}
        srcDoc={getHtmlContent()}
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="OpenStreetMap Web"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', height: '100%' },
});