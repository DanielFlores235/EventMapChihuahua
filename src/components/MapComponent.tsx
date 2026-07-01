import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { Event, TouristSpot } from '../types';
import { Ionicons } from '@expo/vector-icons';

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
  
  const getCategoryConfig = (category?: string) => {
    switch (category) {
      case 'Música': return { color: '#A855F7', icon: 'musical-notes' };
      case 'Deportes': return { color: '#F97316', icon: 'football' };
      case 'Cultura': return { color: '#EC4899', icon: 'color-palette' };
      case 'Tecnología': return { color: '#06B6D4', icon: 'hardware-chip' };
      default: return { color: '#EF4444', icon: 'ticket' };
    }
  };
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        mapType="none" // Para que muestre solo la capa de OpenStreetMap
        onPress={(e) => {
          if (onMapPress) {
            onMapPress(e.nativeEvent.coordinate);
          }
        }}
      >
        {/* Capa de OpenStreetMap */}
        <UrlTile
          urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
        />

        {/* Marcador de la ubicación del usuario (Azul) */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="Tu ubicación"
            pinColor="blue"
          />
        )}

        {/* Marcador temporal seleccionado (para la creación de eventos) */}
        {selectedCoords && (
          <Marker
            coordinate={selectedCoords}
            title="Ubicación seleccionada"
            pinColor="green"
          />
        )}

        {/* Marcadores de los eventos (Dinámicos) */}
        {events.map((event) => {
          const config = getCategoryConfig(event.category);
          return (
            <Marker
              key={event.id}
              coordinate={{ latitude: event.latitude, longitude: event.longitude }}
              title={event.name}
              description={event.distance ? `A ${event.distance}` : event.category || 'Evento'}
              onPress={() => onSelectEvent(event)}
            >
              <View style={[styles.customPin, { backgroundColor: config.color }]}>
                <Ionicons name={config.icon as any} size={16} color="#FFF" />
              </View>
              <View style={[styles.pinTriangle, { borderTopColor: config.color }]} />
            </Marker>
          );
        })}

        {/* Marcadores de Lugares Turísticos */}
        {touristSpots.map((spot) => (
          <Marker
            key={`spot-${spot.id}`}
            coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
            title={spot.name}
            description="Sitio Turístico"
            onPress={() => onSelectSpot && onSelectSpot(spot)}
          >
            <View style={[styles.customPin, { backgroundColor: '#FBBF24' }]}>
              <Ionicons name="camera" size={16} color="#FFF" />
            </View>
            <View style={[styles.pinTriangle, { borderTopColor: '#FBBF24' }]} />
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', height: '100%' },
  map: { width: '100%', height: '100%' },
  customPin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 4,
  },
  pinTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 0,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    alignSelf: 'center',
    marginTop: -2,
  },
});
