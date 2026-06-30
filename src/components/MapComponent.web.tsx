import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Event } from '../types';

interface MapComponentProps {
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  userLocation: { latitude: number; longitude: number } | null;
  events: Event[];
  onSelectEvent: (event: Event) => void;
  onMapPress?: (coords: { latitude: number; longitude: number }) => void;
  selectedCoords?: { latitude: number; longitude: number } | null;
}

export default function MapComponent({
  initialRegion,
  userLocation,
  events,
  onSelectEvent,
  onMapPress,
  selectedCoords
}: MapComponentProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Genera el contenido HTML para el mapa interactivo usando Leaflet y OpenStreetMap
  const getHtmlContent = () => {
    const centerLat = selectedCoords?.latitude ?? userLocation?.latitude ?? initialRegion.latitude;
    const centerLng = selectedCoords?.longitude ?? userLocation?.longitude ?? initialRegion.longitude;

    // Marcadores para eventos
    const markersScript = events.map(e => `
      var marker = L.marker([${e.latitude}, ${e.longitude}]).addTo(map);
      marker.bindPopup(\`
        <div style="font-family: sans-serif; min-width: 150px;">
          <h4 style="margin: 0 0 5px 0; color: #333; font-size: 14px;">\${escapeHtml(${JSON.stringify(e.name)})}</h4>
          \${${JSON.stringify(e.category || '')} ? \`<p style="margin: 0 0 5px 0; font-size: 12px; color: #666;">🏷️ \${escapeHtml(${JSON.stringify(e.category || '')})}</p>\` : ''}
          \${${JSON.stringify(e.distance || '')} ? \`<p style="margin: 0 0 8px 0; font-size: 12px; color: #1E90FF; font-weight: bold;">📍 a \${escapeHtml(${JSON.stringify(e.distance || '')})}</p>\` : ''}
          \${${JSON.stringify(e.date || '')} ? \`<p style="margin: 0 0 8px 0; font-size: 12px; color: #555;">📅 \${escapeHtml(${JSON.stringify(e.date || '')})}</p>\` : ''}
          <button onclick="window.parent.postMessage({type: 'SELECT_EVENT', eventId: ${e.id}}, '*')" 
                  style="background-color: #1E90FF; color: white; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold; width: 100%; transition: background-color 0.2s;">
            Ver Detalles
          </button>
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
          html, body, #map { height: 100%; margin: 0; padding: 0; width: 100%; }
          .leaflet-popup-content-wrapper { border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
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

          var map = L.map('map').setView([${centerLat}, ${centerLng}], 14);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);

          map.on('click', function(e) {
            window.parent.postMessage({
              type: 'MAP_CLICK',
              latitude: e.latlng.lat,
              longitude: e.latlng.lng
            }, '*');
          });

          ${markersScript}
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