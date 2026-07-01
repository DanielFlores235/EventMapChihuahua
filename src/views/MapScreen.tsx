import React, { useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity, ScrollView, TextInput, Image } from 'react-native';
import { useLocation } from '../hooks/useLocation';
import { useEvents } from '../hooks/useEvents';
import { useSpots } from '../hooks/useSpots';
import { Event, TouristSpot } from '../types';
import { Ionicons } from '@expo/vector-icons';
import MapComponent from '../components/MapComponent';
import { EventCard } from '../components/EventCard';

export default function MapScreen({ navigation }: any) {
  const { location, errorMsg, isLoading: isLoadingLocation } = useLocation();
  const { events, loadNearbyEvents, isLoadingEvents } = useEvents();
  const { spots } = useSpots();

  // Ref para controlar que la carga automática solo ocurra una vez
  const hasLoadedEvents = React.useRef(false);

<<<<<<< Updated upstream
=======
  // Ubicación del usuario simulada
  const [simulatedCoords, setSimulatedCoords] = React.useState<{ latitude: number; longitude: number } | null>(null);
  // Modo de click en el mapa: 'walk' (simular caminar) o 'create' (crear evento en ese punto)
  const [mapClickMode, setMapClickMode] = React.useState<'walk' | 'create'>('walk');
  const [showEventList, setShowEventList] = React.useState(false);
  
  // Alertas de eventos cercanos
  const [alertedEvents, setAlertedEvents] = React.useState<number[]>([]);
  const [nearbyAlertEvent, setNearbyAlertEvent] = React.useState<Event | null>(null);

  // Alertas de lugares turísticos cercanos
  const [alertedSpots, setAlertedSpots] = React.useState<number[]>([]);
  const [nearbyAlertSpot, setNearbyAlertSpot] = React.useState<TouristSpot | null>(null);

  // Inicializar la ubicación simulada con el GPS real
  useEffect(() => {
    if (location && !simulatedCoords) {
      setSimulatedCoords({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
    }
  }, [location, simulatedCoords]);

>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
=======
  // Fórmula de Haversine para calcular distancia en metros
  const getDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Radio de la Tierra en metros
    const phi1 = lat1 * Math.PI/180;
    const phi2 = lat2 * Math.PI/180;
    const deltaPhi = (lat2-lat1) * Math.PI/180;
    const deltaLambda = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  // Reproducir un pitido de alerta utilizando Web Audio API
  const playAlertSound = () => {
    try {
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const playTone = (delay: number, duration: number, freq: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
          gain.gain.setValueAtTime(0.15, ctx.currentTime + delay);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + duration);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + duration);
        };
        
        playTone(0, 0.15, 880); // Tono 1
        playTone(0.2, 0.15, 880); // Tono 2
        playTone(0.4, 0.3, 1100); // Tono 3 (Más alto)
      }
    } catch (e) {
      console.log('AudioContext error o bloqueado:', e);
    }
  };

  // Comprobar eventos y lugares turísticos cercanos cuando cambia la ubicación simulada
  useEffect(() => {
    if (!simulatedCoords) return;
    
    // Buscar eventos a menos de 200 metros que no hayamos alertado en esta sesión
    if (events.length > 0) {
      const nearbyE = events.find(e => {
        const dist = getDistanceMeters(simulatedCoords.latitude, simulatedCoords.longitude, e.latitude, e.longitude);
        return dist <= 200 && !alertedEvents.includes(e.id);
      });

      if (nearbyE) {
        setAlertedEvents(prev => [...prev, nearbyE.id]);
        setNearbyAlertEvent(nearbyE);
        playAlertSound();
      }
    }

    // Buscar centros turísticos a menos de 200 metros
    if (spots && spots.length > 0) {
      const nearbyS = spots.find(s => {
        const dist = getDistanceMeters(simulatedCoords.latitude, simulatedCoords.longitude, s.latitude, s.longitude);
        return dist <= 200 && !alertedSpots.includes(s.id);
      });

      if (nearbyS) {
        setAlertedSpots(prev => [...prev, nearbyS.id]);
        setNearbyAlertSpot(nearbyS);
        playAlertSound();
      }
    }
  }, [simulatedCoords, events, spots, alertedEvents, alertedSpots]);

>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
        <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
=======
        <Text style={styles.errorText}><Ionicons name="warning" size={20} color="#F87171" /> {errorMsg}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}><Ionicons name="refresh" size={16} color="#FFF" /> Reintentar</Text>
>>>>>>> Stashed changes
        </TouchableOpacity>
      </View>
    );
  }

<<<<<<< Updated upstream
=======


>>>>>>> Stashed changes
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
      {/* Mapa Principal */}
      <MapComponent
        initialRegion={initialRegion}
        userLocation={userCoords}
        events={events}
        touristSpots={spots}
        onSelectEvent={handleSelectEvent}
        onMapPress={handleMapPress}
      />

<<<<<<< Updated upstream
      {/* Título y estado flotante superior */}
      <View style={styles.headerOverlay}>
        <Text style={styles.headerTitle}>EventMap Chihuahua</Text>
        <Text style={styles.headerSubtitle}>
          {events.length} {events.length === 1 ? 'evento encontrado' : 'eventos encontrados'} a la redonda
        </Text>
      </View>

=======
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
                    event={{...spot, date: 'Abierto al público', category: 'Turismo', distance: spot.description} as any}
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

      {/* Alerta de proximidad Modal flotante para Lugares Turísticos */}
      {nearbyAlertSpot && (
        <View style={styles.alertOverlay}>
          <View style={styles.alertBox}>
            <Ionicons name="camera" size={48} color="#FBBF24" style={{ marginBottom: 12 }} />
            <Text style={styles.alertTitle}>¡Sitio Turístico Cercano!</Text>
            <Text style={styles.alertDescription}>
              Te encuentras a menos de 200 metros de "{nearbyAlertSpot.name}".
            </Text>
            <View style={styles.alertButtons}>
              <TouchableOpacity 
                style={[styles.alertBtnAction, styles.alertBtnClose]}
                onPress={() => setNearbyAlertSpot(null)}
              >
                <Text style={styles.alertBtnCloseText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Alerta de proximidad Modal flotante para Eventos */}
      {nearbyAlertEvent && (
        <View style={styles.alertOverlay}>
          <View style={styles.alertBox}>
            <Ionicons name="notifications" size={48} color="#3B82F6" style={{ marginBottom: 12 }} />
            <Text style={styles.alertTitle}>¡Evento Cercano!</Text>
            <Text style={styles.alertDescription}>
              Te encuentras a menos de 200 metros de "{nearbyAlertEvent.name}".
            </Text>
            <View style={styles.alertButtons}>
              <TouchableOpacity 
                style={[styles.alertBtnAction, styles.alertBtnView]}
                onPress={() => {
                  const ev = nearbyAlertEvent;
                  setNearbyAlertEvent(null);
                  navigation.navigate('EventDetail', { event: ev });
                }}
              >
                <Text style={styles.alertBtnViewText}>Ver Evento</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.alertBtnAction, styles.alertBtnClose]}
                onPress={() => setNearbyAlertEvent(null)}
              >
                <Text style={styles.alertBtnCloseText}>Ignorar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

>>>>>>> Stashed changes
      {/* Cargador flotante secundario */}
      {isLoadingEvents && (
        <View style={styles.floatingLoader}>
          <ActivityIndicator size="small" color="#FFF" />
          <Text style={styles.floatingText}>Buscando eventos...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative', backgroundColor: '#F1F5F9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F5F9' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#64748B', fontWeight: '500' },
  errorText: { fontSize: 16, color: '#EF4444', textAlign: 'center', paddingHorizontal: 20, marginBottom: 15, fontWeight: '500' },
  retryButton: { backgroundColor: '#3B82F6', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  retryButtonText: { color: '#FFF', fontWeight: 'bold' },

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
<<<<<<< Updated upstream
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
=======
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



  /* ALERTA MODAL */
  alertOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center', alignItems: 'center', zIndex: 999, padding: 20,
  },
  alertBox: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 20, padding: 24, width: '100%', maxWidth: 320, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 10,
  },
  alertTitle: { fontSize: 20, fontWeight: 'bold', color: '#0F172A', marginBottom: 8 },
  alertDescription: { fontSize: 14, color: '#475569', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  alertButtons: { flexDirection: 'row', width: '100%' },
  alertBtnAction: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginHorizontal: 6 },
  alertBtnView: { backgroundColor: '#3B82F6' },
  alertBtnViewText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  alertBtnClose: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CBD5E1' },
  alertBtnCloseText: { color: '#64748B', fontWeight: 'bold', fontSize: 14 },
  
  floatingLoader: { display: 'none' },
>>>>>>> Stashed changes
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
