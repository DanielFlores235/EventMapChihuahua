import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import MapComponent from '../components/MapComponent';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTransport } from '../hooks/useTransport';
import { useSpots } from '../hooks/useSpots';

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

export default function SpotDetailScreen({ route, navigation }: any) {
  const { spot } = route.params;
  const { calculateNearestRoute } = useTransport();
  const { deleteSpot } = useSpots();

  const [directions, setDirections] = useState<any | null>(null);
  const [walkingOnlyData, setWalkingOnlyData] = useState<{distanceMeters: number, walkingMins: number} | null>(null);
  const [transportMode, setTransportMode] = useState<'public' | 'walk'>('public');

  const initialRegion = {
    latitude: spot.latitude,
    longitude: spot.longitude,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  };

  useEffect(() => {
    const fetchDirections = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        
        const loc = await Location.getCurrentPositionAsync({});
        
        const result = await calculateNearestRoute(
          loc.coords.latitude, loc.coords.longitude, spot.latitude, spot.longitude
        );
        if (result) setDirections(result);

        const pureDistance = getDistance(loc.coords.latitude, loc.coords.longitude, spot.latitude, spot.longitude);
        const pureWalkingMins = Math.ceil(pureDistance / 83);
        setWalkingOnlyData({ distanceMeters: Math.round(pureDistance), walkingMins: pureWalkingMins });

      } catch (e) {
        console.log('No se pudo generar ruta.');
      }
    };
    fetchDirections();
  }, []);

  const handleDelete = () => {
    const performDelete = async () => {
      try {
        await deleteSpot(spot.id);
        navigation.navigate('Map');
      } catch (error) {
        Alert.alert('Error', 'No se pudo eliminar el lugar.');
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm('¿Eliminar este lugar turístico?')) performDelete();
    } else {
      Alert.alert('Confirmar', '¿Eliminar este lugar?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: performDelete }
      ]);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.badge}><Text style={styles.badgeText}>SITIO TURÍSTICO</Text></View>
        <Text style={styles.title}>{spot.name}</Text>
        
        <View style={styles.detailsGroup}>
          <View style={styles.detailItem}>
            <Ionicons name="information-circle" size={20} color="#3B82F6" style={styles.detailIcon} />
            <View style={styles.addressWrapper}>
              <Text style={styles.detailLabel}>Descripción</Text>
              <Text style={styles.detailValue}>{spot.description || 'Sin descripción'}</Text>
            </View>
          </View>
          {(spot.start_time || spot.end_time) && (
            <View style={styles.detailItem}>
              <Ionicons name="time" size={20} color="#3B82F6" style={styles.detailIcon} />
              <View>
                <Text style={styles.detailLabel}>Horario de Visita</Text>
                <Text style={styles.detailValue}>{spot.start_time || 'N/A'} - {spot.end_time || 'N/A'}</Text>
              </View>
            </View>
          )}
        </View>

        {(directions || walkingOnlyData) && (
          <View style={styles.modeToggleContainer}>
            <TouchableOpacity style={[styles.modeBtn, transportMode === 'public' && styles.modeBtnActive]} onPress={() => setTransportMode('public')}>
              <Ionicons name="bus" size={16} color={transportMode === 'public' ? "#0F172A" : "#94A3B8"} />
              <Text style={[styles.modeBtnText, transportMode === 'public' && styles.modeBtnTextActive]}>Camión</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modeBtn, transportMode === 'walk' && styles.modeBtnActive]} onPress={() => setTransportMode('walk')}>
              <Ionicons name="walk" size={16} color={transportMode === 'walk' ? "#0F172A" : "#94A3B8"} />
              <Text style={[styles.modeBtnText, transportMode === 'walk' && styles.modeBtnTextActive]}>Caminar</Text>
            </TouchableOpacity>
          </View>
        )}

        {transportMode === 'public' && directions && (
          <View style={styles.directionsCard}>
            <Text style={styles.directionsTitle}><Ionicons name="navigate-circle" size={18} color="#34D399" /> Smart Navigation</Text>
            <View style={styles.stepItem}>
              <Ionicons name="walk" size={16} color="#CBD5E1" />
              <Text style={styles.stepText}>Camina <Text style={{ color: '#34D399', fontWeight: 'bold' }}>{directions.walking_time_mins} min</Text> a la Parada {directions.name}</Text>
            </View>
            <View style={styles.stepItem}>
              <Ionicons name="bus" size={16} color="#CBD5E1" />
              <Text style={styles.stepText}>Aborda la Unidad <Text style={{ color: '#F97316', fontWeight: 'bold' }}>{directions.route_name}</Text></Text>
            </View>
          </View>
        )}

        {transportMode === 'walk' && walkingOnlyData && (
          <View style={styles.directionsCard}>
            <Text style={styles.directionsTitle}><Ionicons name="navigate-circle" size={18} color="#34D399" /> Ruta Peatonal</Text>
            <View style={styles.stepItem}>
              <Ionicons name="walk" size={16} color="#CBD5E1" />
              <Text style={styles.stepText}>Distancia recta: <Text style={{ color: '#34D399', fontWeight: 'bold' }}>{walkingOnlyData.distanceMeters} m</Text></Text>
            </View>
            <View style={styles.stepItem}>
              <Ionicons name="time" size={16} color="#CBD5E1" />
              <Text style={styles.stepText}>Tiempo a pie: <Text style={{ color: '#3B82F6', fontWeight: 'bold' }}>{walkingOnlyData.walkingMins} min</Text></Text>
            </View>
          </View>
        )}

        {/* Mini mapa real del sitio */}
        <Text style={styles.mapLabel}><Ionicons name="map" size={14} color="#CBD5E1" /> Ubicación en el Mapa</Text>
        <View style={styles.mapContainer}>
          <MapComponent
            initialRegion={initialRegion}
            userLocation={null}
            events={[]} 
            touristSpots={[spot]}
            onSelectEvent={() => {}}
          />
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}><Ionicons name="trash" size={16} color="#FFF" /> Eliminar Sitio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}><Ionicons name="arrow-back" size={16} color="#CBD5E1" /> Volver</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 16 },
  card: { backgroundColor: '#1E293B', padding: 20, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  badge: { alignSelf: 'flex-start', backgroundColor: '#0F172A', paddingVertical: 5, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: '#334155', marginBottom: 12 },
  badgeText: { fontSize: 11, color: '#F8FAFC', fontWeight: 'bold' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#F8FAFC' },
  detailsGroup: { borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 15, marginBottom: 20 },
  detailItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  detailIcon: { marginRight: 12, marginTop: 2 },
  detailLabel: { fontSize: 12, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 2 },
  detailValue: { fontSize: 15, color: '#CBD5E1', fontWeight: '600', marginTop: 2 },
  addressWrapper: { flex: 1, paddingRight: 10 },
  modeToggleContainer: { flexDirection: 'row', backgroundColor: '#0F172A', borderRadius: 8, padding: 4, marginBottom: 15, borderWidth: 1, borderColor: '#334155' },
  modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 6, gap: 6 },
  modeBtnActive: { backgroundColor: '#34D399' },
  modeBtnText: { color: '#94A3B8', fontWeight: 'bold', fontSize: 14 },
  modeBtnTextActive: { color: '#0F172A' },
  directionsCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 15, marginBottom: 25, borderWidth: 1, borderColor: '#334155' },
  directionsTitle: { color: '#34D399', fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  stepItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  stepText: { color: '#94A3B8', marginLeft: 10, fontSize: 14 },
  actions: { marginBottom: 40 },
  deleteButton: { backgroundColor: '#EF4444', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  deleteButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  backButton: { backgroundColor: 'transparent', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#475569' },
  backButtonText: { color: '#CBD5E1', fontSize: 16, fontWeight: 'bold' },
  mapLabel: { color: '#94A3B8', fontSize: 14, fontWeight: 'bold', marginBottom: 10, marginTop: 10, textTransform: 'uppercase' },
  mapContainer: { height: 200, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#334155' }
});
