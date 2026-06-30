import React, { useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocation } from '../hooks/useLocation';
import { useEvents } from '../hooks/useEvents';
import MapComponent from '../components/MapComponent';
import { Event } from '../types';

export default function MapScreen({ navigation }: any) {
  const { location, errorMsg, isLoading: isLoadingLocation } = useLocation();
  const { events, loadNearbyEvents, isLoadingEvents } = useEvents();

  // Ref para controlar que la carga automática solo ocurra una vez
  const hasLoadedEvents = React.useRef(false);

  // Carga inicial de eventos cuando se obtiene la ubicación
  useEffect(() => {
    if (location && !hasLoadedEvents.current) {
      hasLoadedEvents.current = true;
      loadNearbyEvents(location.coords.latitude, location.coords.longitude);
    }
  }, [location, loadNearbyEvents]);

  // Recargar eventos manualmente
  const handleRefresh = () => {
    if (location) {
      loadNearbyEvents(location.coords.latitude, location.coords.longitude);
    }
  };

  if (isLoadingLocation) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E90FF" />
        <Text style={styles.loadingText}>Obteniendo tu ubicación satelital...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const initialRegion = {
    latitude: location?.coords.latitude ?? 28.6353,
    longitude: location?.coords.longitude ?? -106.0889,
    latitudeDelta: 0.035,
    longitudeDelta: 0.035,
  };

  const userCoords = location ? {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude
  } : null;

  const handleSelectEvent = (event: Event) => {
    navigation.navigate('EventDetail', { event });
  };

  // Cuando tocan una coordenada en el mapa libre, abrimos la pantalla de creación con esa coordenada
  const handleMapPress = (coords: { latitude: number; longitude: number }) => {
    navigation.navigate('CreateEvent', {
      latitude: coords.latitude,
      longitude: coords.longitude
    });
  };

  return (
    <View style={styles.container}>
      {/* Mapa Principal (Se adapta a Web y Nativo automáticamente) */}
      <MapComponent
        initialRegion={initialRegion}
        userLocation={userCoords}
        events={events}
        onSelectEvent={handleSelectEvent}
        onMapPress={handleMapPress}
      />

      {/* Título y estado flotante superior */}
      <View style={styles.headerOverlay}>
        <Text style={styles.headerTitle}>EventMap Chihuahua</Text>
        <Text style={styles.headerSubtitle}>
          {events.length} {events.length === 1 ? 'evento encontrado' : 'eventos encontrados'} a la redonda
        </Text>
      </View>

      {/* Cargador flotante secundario */}
      {isLoadingEvents && (
        <View style={styles.floatingLoader}>
          <ActivityIndicator size="small" color="#FFF" />
          <Text style={styles.floatingText}>Buscando eventos...</Text>
        </View>
      )}

      {/* Botones de acción flotantes en la parte inferior */}
      <View style={styles.actionContainer}>
        {/* Ir a Lista */}
        <TouchableOpacity 
          style={[styles.actionButton, styles.listButton]} 
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonText}>📋 Ver Lista</Text>
        </TouchableOpacity>

        {/* Añadir Evento */}
        <TouchableOpacity 
          style={[styles.actionButton, styles.createButton]} 
          onPress={() => navigation.navigate('CreateEvent')}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonText}>➕ Nuevo Evento</Text>
        </TouchableOpacity>

        {/* Recargar */}
        <TouchableOpacity 
          style={[styles.actionButton, styles.refreshButton]} 
          onPress={handleRefresh}
          activeOpacity={0.8}
        >
          <Text style={styles.refreshButtonText}>🔄</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#475569', fontWeight: '500' },
  errorText: { fontSize: 16, color: '#EF4444', textAlign: 'center', paddingHorizontal: 20, marginBottom: 15, fontWeight: '500' },
  retryButton: { backgroundColor: '#1E90FF', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  retryButtonText: { color: '#FFF', fontWeight: 'bold' },
  
  headerOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  headerSubtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },

  floatingLoader: {
    position: 'absolute',
    top: 110,
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  floatingText: { color: '#FFF', marginLeft: 8, fontSize: 13, fontWeight: '500' },
  
  actionContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  listButton: {
    backgroundColor: '#FFF',
    flex: 1,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  createButton: {
    backgroundColor: '#1E90FF',
    flex: 1.2,
    marginRight: 10,
  },
  refreshButton: {
    backgroundColor: '#475569',
    width: 48,
    height: 48,
    paddingVertical: 0,
    borderRadius: 24,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  refreshButtonText: {
    fontSize: 16,
  },
});
// Ajuste de color de texto específico para el botón de creación
styles.actionButtonText = {
  ...styles.actionButtonText,
  color: '#0F172A', // List button text
};
styles.createButtonText = {
  fontSize: 14,
  fontWeight: 'bold',
  color: '#FFF',
};
