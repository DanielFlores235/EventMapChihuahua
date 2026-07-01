import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator,
  TextInput,
  ScrollView
} from 'react-native';
import MapComponent from '../components/MapComponent';
import { EventCard } from '../components/EventCard';
import { useEvents } from '../hooks/useEvents';
import { useSpots } from '../hooks/useSpots';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

export default function MapScreen({ navigation }: any) {
  const { events, isLoadingEvents, loadAllEvents } = useEvents();
  const { spots, loadSpots } = useSpots();

  const [userCoords, setUserCoords] = useState<{latitude: number; longitude: number} | null>(null);
  const [mapClickMode, setMapClickMode] = useState<'walk' | 'create'>('walk');
  const [showEventList, setShowEventList] = useState(false);

  // Chihuahua Centro por defecto
  const initialRegion = {
    latitude: 28.6353,
    longitude: -106.0889,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  useEffect(() => {
    loadAllEvents();
    loadSpots();
  }, []);

  const handleRefresh = async () => {
    await loadAllEvents();
    await loadSpots();
  };

  const handleSelectEvent = (event: any) => {
    navigation.navigate('EventDetail', { event });
  };

  const handleMapPress = (coords: { latitude: number; longitude: number }) => {
    if (mapClickMode === 'walk') {
      // Futura implementación de caminata
    } else {
      navigation.navigate('CreateEvent', {
        latitude: coords.latitude,
        longitude: coords.longitude
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Mapa Principal */}
      <MapComponent
        initialRegion={initialRegion}
        userLocation={userCoords}
        events={events}
        touristSpots={spots}
        onSelectEvent={handleSelectEvent}
        onMapPress={handleMapPress}
      />

      {/* HEADER SUPERIOR */}
      <View style={styles.topHeaderCard}>
        <View style={styles.headerLeft}>
          <Ionicons name="compass" size={24} color="#3B82F6" />
          <Text style={styles.headerTitle}>EventMap Chihuahua</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.listToggleButton}
            onPress={() => setShowEventList(!showEventList)}
          >
            <Ionicons name={showEventList ? "close" : "list"} size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* PANEL LATERAL DE EVENTOS Y SITIOS */}
      {showEventList && (
        <View style={styles.sidePanel}>
          <Text style={styles.sidePanelTitle}>Directorio Interactivo</Text>
          <ScrollView style={styles.sidePanelScroll} showsVerticalScrollIndicator={false}>
            {events.length === 0 && spots.length === 0 ? (
              <Text style={styles.noEventsText}>No hay elementos registrados aún.</Text>
            ) : (
              <>
                {events.map((event, idx) => (
                  <EventCard 
                    key={`ev-${event.id || idx}`} 
                    event={event}
                    onPress={() => navigation.navigate('EventDetail', { event })}
                  />
                ))}
                {spots.map((spot, idx) => (
                  <EventCard 
                    key={`sp-${spot.id || idx}`} 
                    event={{...spot, date: spot.start_time ? `${spot.start_time} - ${spot.end_time}` : 'Abierto al público', category: 'Turismo', distance: spot.description} as any}
                  />
                ))}
              </>
            )}
          </ScrollView>
        </View>
      )}

      {/* CONTROLES DEL MAPA (BOTTOM RIGHT) */}
      <View style={styles.mapControls}>
        <TouchableOpacity style={styles.mapCtrlBtn}>
          <Ionicons name="add" size={20} color="#1E293B" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.mapCtrlBtn}>
          <Ionicons name="remove" size={20} color="#1E293B" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.mapCtrlBtn, { marginTop: 10 }]} onPress={handleRefresh}>
          <Ionicons name="locate" size={20} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* PANEL CENTRAL INFERIOR (BOTTOM CENTER) */}
      <View style={styles.bottomCenterPanel}>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.segmentBtn, mapClickMode === 'walk' && styles.segmentBtnActive]}
            onPress={() => setMapClickMode('walk')}
          >
            <Ionicons name="walk" size={14} color={mapClickMode === 'walk' ? "#FFF" : "#64748B"} />
            <Text style={[styles.segmentBtnText, mapClickMode === 'walk' && styles.segmentBtnTextActive]}>Caminar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, mapClickMode === 'create' && styles.segmentBtnActive]}
            onPress={() => setMapClickMode('create')}
          >
            <Ionicons name="add-circle" size={14} color={mapClickMode === 'create' ? "#FFF" : "#64748B"} />
            <Text style={[styles.segmentBtnText, mapClickMode === 'create' && styles.segmentBtnTextActive]}>Crear Evento</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Cargador flotante secundario */}
      {isLoadingEvents && (
        <View style={styles.floatingLoader}>
          <ActivityIndicator size="small" color="#FFF" />
          <Text style={styles.floatingText}>Sincronizando...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative', backgroundColor: '#F1F5F9' },

  /* HEADER SUPERIOR */
  topHeaderCard: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
    width: '90%',
    maxWidth: 900,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    zIndex: 20,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E3A8A', marginLeft: 10 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  listToggleButton: {
    backgroundColor: '#3B82F6',
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* PANEL LATERAL */
  sidePanel: {
    position: 'absolute',
    top: 90,
    left: 20,
    bottom: 110,
    width: 320,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 6,
    zIndex: 15,
    padding: 16,
    overflow: 'hidden',
  },
  sidePanelTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  sidePanelScroll: {
    flex: 1,
  },
  noEventsText: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },

  /* MAP CONTROLS */
  mapControls: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    zIndex: 10,
  },
  mapCtrlBtn: {
    backgroundColor: '#FFF',
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  /* BOTTOM CENTER PANEL */
  bottomCenterPanel: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    alignItems: 'center',
    zIndex: 15,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 30,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 15,
  },
  segmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 26,
    backgroundColor: 'transparent',
  },
  segmentBtnActive: { backgroundColor: '#3B82F6' },
  segmentBtnText: { fontSize: 13, fontWeight: '600', color: '#64748B', marginLeft: 6 },
  segmentBtnTextActive: { color: '#FFF', fontWeight: 'bold' },

  floatingLoader: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 50,
  },
  floatingText: {
    color: '#FFF',
    marginLeft: 10,
    fontWeight: 'bold',
  },
});
