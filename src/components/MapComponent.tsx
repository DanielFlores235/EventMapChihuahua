import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
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

        {/* Marcadores de los eventos (Rojos) */}
        {events.map((event) => (
          <Marker
            key={event.id}
            coordinate={{
              latitude: event.latitude,
              longitude: event.longitude,
            }}
            title={event.name}
            description={event.distance ? `A ${event.distance}` : event.category || 'Evento'}
            pinColor="red"
            onPress={() => onSelectEvent(event)}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', height: '100%' },
  map: { width: '100%', height: '100%' },
});
