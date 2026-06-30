import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { Event } from '../types';

interface MapMarkerProps {
  event: Event;
  onPress?: () => void;
}

export const MapMarker: React.FC<MapMarkerProps> = ({ event, onPress }) => {
  // Una función sencilla para asignar colores por categoría
  const getMarkerColor = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'música': return '#E91E63'; // Rosa
      case 'cultura': return '#9C27B0'; // Morado
      case 'tecnología': return '#2196F3'; // Azul
      default: return '#FF3B30'; // Rojo por defecto
    }
  };

  return (
    <Marker
      coordinate={{
        latitude: event.latitude,
        longitude: event.longitude,
      }}
      onPress={onPress}
      // Configuración del popup nativo (Callout) al tocar el pin
      title={event.name}
      description={event.distance ? `A ${event.distance}` : event.category || 'Evento'}
    >
      {/* Vista personalizada del marcador */}
      <View style={styles.markerContainer}>
        <View style={[styles.pin, { backgroundColor: getMarkerColor(event.category) }]}>
          <Text style={styles.pinText}>🎟️</Text>
        </View>
        <View style={[styles.pointer, { borderTopColor: getMarkerColor(event.category) }]} />
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pin: {
    padding: 8,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  pinText: {
    fontSize: 14,
  },
  pointer: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2, // Para que se una bien con el círculo
  },
});