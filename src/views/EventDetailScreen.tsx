import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import MapComponent from '../components/MapComponent';
import { deleteEvent } from '../api/events';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTransport } from '../hooks/useTransport';

// Helper de distancia para modo caminar
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; 
  const p1 = lat1 * Math.PI/180;
  const p2 = lat2 * Math.PI/180;
  const dp = (lat2-lat1) * Math.PI/180;
  const dl = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(dp/2) * Math.sin(dp/2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export default function EventDetailScreen({ route, navigation }: any) {
  // Recibimos el evento por los parámetros de navegación
  const { event } = route.params;
  const { calculateNearestRoute } = useTransport();

  const [directions, setDirections] = useState<any | null>(null);
  const [walkingOnlyData, setWalkingOnlyData] = useState<{distanceMeters: number, walkingMins: number} | null>(null);
  const [transportMode, setTransportMode] = useState<'public' | 'walk'>('public');

  useEffect(() => {
    const fetchDirections = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        
        const loc = await Location.getCurrentPositionAsync({});
        
        // Ruta Transporte
        const result = await calculateNearestRoute(
          loc.coords.latitude, 
          loc.coords.longitude, 
          event.latitude, 
          event.longitude
        );
        if (result) setDirections(result);

        // Ruta Peatonal Pura
        const pureDistance = getDistance(loc.coords.latitude, loc.coords.longitude, event.latitude, event.longitude);
        const pureWalkingMins = Math.ceil(pureDistance / 83); // 83 metros por minuto (~5 km/h)
        setWalkingOnlyData({ distanceMeters: Math.round(pureDistance), walkingMins: pureWalkingMins });

      } catch (e) {
        console.log('No se pudo generar ruta.');
      }
    };
    fetchDirections();
  }, []);

  const initialRegion = {
    latitude: event.latitude,
    longitude: event.longitude,
    latitudeDelta: 0.015, // Más Zoom para ver las calles del evento
    longitudeDelta: 0.015,
  };

  const handleEdit = () => {
    navigation.navigate('CreateEvent', { event });
  };

  const handleDelete = () => {
    const performDelete = async () => {
      try {
        await deleteEvent(event.id);
        if (Platform.OS === 'web') {
          alert('¡Evento eliminado con éxito!');
        } else {
          Alert.alert('Éxito', '¡Evento eliminado con éxito!');
        }
        navigation.navigate('Map');
      } catch (error) {
        if (Platform.OS === 'web') {
          alert('No se pudo eliminar el evento.');
        } else {
          Alert.alert('Error', 'No se pudo eliminar el evento.');
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('¿Estás seguro de que deseas eliminar este evento?')) {
        performDelete();
      }
    } else {
      Alert.alert(
        'Confirmar eliminación',
        '¿Estás seguro de que deseas eliminar este evento?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: performDelete }
        ]
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        {/* Categoría Badge */}
        {event.category && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{event.category.toUpperCase()}</Text>
          </View>
        )}

        {/* Título */}
        <Text style={styles.title}>{event.name}</Text>
        
        {/* Detalles */}
        <View style={styles.detailsGroup}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar" size={20} color="#3B82F6" style={styles.detailIcon} />
            <View>
              <Text style={styles.detailLabel}>Fecha del evento</Text>
              <Text style={styles.detailValue}>{event.date}</Text>
            </View>
          </View>

          {(event.start_time || event.end_time) && (
            <View style={styles.detailItem}>
              <Ionicons name="time" size={20} color="#3B82F6" style={styles.detailIcon} />
              <View>
                <Text style={styles.detailLabel}>Horario</Text>
                <Text style={styles.detailValue}>
                  {event.start_time || 'N/A'} - {event.end_time || 'N/A'}
                </Text>
              </View>
            </View>
          )}

          {event.distance && (
            <View style={styles.detailItem}>
              <Ionicons name="location" size={20} color="#3B82F6" style={styles.detailIcon} />
              <View>
                <Text style={styles.detailLabel}>Distancia desde ti</Text>
                <Text style={styles.detailValue}>{event.distance}</Text>
              </View>
            </View>
          )}

          {event.address && (
            <View style={styles.detailItem}>
              <Ionicons name="business" size={20} color="#3B82F6" style={styles.detailIcon} />
              <View style={styles.addressWrapper}>
                <Text style={styles.detailLabel}>Dirección / Lugar</Text>
                <Text style={styles.detailValue}>{event.address}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Selector de Modo de Transporte */}
        {(directions || walkingOnlyData) && (
          <View style={styles.modeToggleContainer}>
            <TouchableOpacity 
              style={[styles.modeBtn, transportMode === 'public' && styles.modeBtnActive]}
              onPress={() => setTransportMode('public')}
            >
              <Ionicons name="bus" size={16} color={transportMode === 'public' ? "#0F172A" : "#94A3B8"} />
              <Text style={[styles.modeBtnText, transportMode === 'public' && styles.modeBtnTextActive]}>Camión</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modeBtn, transportMode === 'walk' && styles.modeBtnActive]}
              onPress={() => setTransportMode('walk')}
            >
              <Ionicons name="walk" size={16} color={transportMode === 'walk' ? "#0F172A" : "#94A3B8"} />
              <Text style={[styles.modeBtnText, transportMode === 'walk' && styles.modeBtnTextActive]}>Caminar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Recomendación de Ruta (Transporte Público) */}
        {transportMode === 'public' && directions && (
          <View style={styles.directionsCard}>
            <Text style={styles.directionsTitle}><Ionicons name="navigate-circle" size={18} color="#34D399" /> Smart Navigation</Text>
            
            <View style={styles.stepItem}>
              <Ionicons name="walk" size={16} color="#CBD5E1" />
              <Text style={styles.stepText}>Camina <Text style={{ color: '#34D399', fontWeight: 'bold' }}>{directions.walking_time_mins} min</Text> hacia la Parada {directions.name}</Text>
            </View>
            
            <View style={styles.stepItem}>
              <Ionicons name="bus" size={16} color="#CBD5E1" />
              <Text style={styles.stepText}>Aborda la Unidad <Text style={{ color: '#F97316', fontWeight: 'bold' }}>{directions.route_name}</Text></Text>
            </View>
            
            <View style={styles.stepItem}>
              <Ionicons name="pin" size={16} color="#CBD5E1" />
              <Text style={styles.stepText}>Desciende cerca de: <Text style={{ color: '#F8FAFC', fontWeight: 'bold' }}>{event.name}</Text></Text>
            </View>
          </View>
        )}

        {/* Recomendación Peatonal (Caminar) */}
        {transportMode === 'walk' && walkingOnlyData && (
          <View style={styles.directionsCard}>
            <Text style={styles.directionsTitle}><Ionicons name="navigate-circle" size={18} color="#34D399" /> Ruta Peatonal</Text>
            
            <View style={styles.stepItem}>
              <Ionicons name="walk" size={16} color="#CBD5E1" />
              <Text style={styles.stepText}>Distancia recta hacia destino: <Text style={{ color: '#34D399', fontWeight: 'bold' }}>{walkingOnlyData.distanceMeters} metros</Text></Text>
            </View>

            <View style={styles.stepItem}>
              <Ionicons name="time" size={16} color="#CBD5E1" />
              <Text style={styles.stepText}>Tiempo estimado a pie: <Text style={{ color: '#3B82F6', fontWeight: 'bold' }}>{walkingOnlyData.walkingMins} min</Text></Text>
            </View>
          </View>
        )}
        
        {/* Mini mapa real del evento */}
        <Text style={styles.mapLabel}><Ionicons name="map" size={14} color="#CBD5E1" /> Ubicación en el Mapa</Text>
        <View style={styles.mapContainer}>
          <MapComponent
            initialRegion={initialRegion}
            userLocation={null}
            events={[event]} // Le pasamos solo este evento para que dibuje el marcador rojo
            onSelectEvent={() => {}}
          />
        </View>
      </View>

      {/* Botón de retorno */}
      <View style={styles.actions}>
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={handleEdit}
          >
            <Text style={styles.editButtonText}><Ionicons name="pencil" size={16} color="#FFF" /> Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
          >
            <Text style={styles.deleteButtonText}><Ionicons name="trash" size={16} color="#FFF" /> Eliminar</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}><Ionicons name="arrow-back" size={16} color="#CBD5E1" /> Volver al Mapa</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 16 },
  card: { 
    backgroundColor: '#1E293B', 
    padding: 20, 
    borderRadius: 16, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 12, 
    elevation: 6, 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#0F172A',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 11,
    color: '#F8FAFC',
    fontWeight: 'bold',
  },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#F8FAFC' },
  detailsGroup: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 15,
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  detailLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 15,
    color: '#CBD5E1',
    fontWeight: '600',
    marginTop: 2,
  },
  addressWrapper: {
    flex: 1,
    paddingRight: 10,
  },
  
  modeToggleContainer: { flexDirection: 'row', backgroundColor: '#0F172A', borderRadius: 8, padding: 4, marginBottom: 15, borderWidth: 1, borderColor: '#334155' },
  modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 6, gap: 6 },
  modeBtnActive: { backgroundColor: '#34D399' },
  modeBtnText: { color: '#94A3B8', fontWeight: 'bold', fontSize: 14 },
  modeBtnTextActive: { color: '#0F172A' },

  directionsCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 15, marginBottom: 25, borderWidth: 1, borderColor: '#334155' },
  directionsTitle: { color: '#34D399', fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  stepItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  stepText: { color: '#94A3B8', marginLeft: 10, fontSize: 14 },

  mapLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#CBD5E1',
    marginBottom: 10,
    marginTop: 5,
  },
  mapContainer: { 
    height: 180, 
    backgroundColor: '#0F172A', 
    borderRadius: 12, 
    overflow: 'hidden', 
    borderWidth: 1, 
    borderColor: '#334155',
    marginTop: 5 
  },
  actions: {
    marginBottom: 40,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  editButton: {
    backgroundColor: '#3B82F6',
    marginRight: 8,
  },
  editButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    marginLeft: 8,
  },
  deleteButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  backButton: {
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  backButtonText: {
    color: '#CBD5E1',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
