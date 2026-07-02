import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTransport } from '../hooks/useTransport';
import MapView, { Marker, Polyline } from 'react-native-maps';

export default function CreateTransportScreen({ navigation }: any) {
  const { createRoute, deleteRoute, routes } = useTransport();
  
  const [name, setName] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  
  // Parámetros de horario (Nuevos)
  const [startTime, setStartTime] = useState('06:00');
  const [endTime, setEndTime] = useState('22:00');
  const [frequency, setFrequency] = useState('15');

  const [stops, setStops] = useState<{latitude: number, longitude: number, name: string}[]>([]);
  const [currentCenter, setCurrentCenter] = useState({ latitude: 28.632996, longitude: -106.0691 });

  // Agrega una parada en el centro actual del mapa (Solución 100% compatible con la Web)
  const handleAddStopAtCenter = () => {
    setStops([...stops, { latitude: currentCenter.latitude, longitude: currentCenter.longitude, name: `Parada ${stops.length + 1}` }]);
  };

  const handleCreate = async () => {
    if (!name || !origin || !destination) {
      Alert.alert('Error', 'Nombre, origen y destino son obligatorios.');
      return;
    }
    if (stops.length < 2) {
      Alert.alert('Aviso', 'Es recomendable marcar al menos 2 paradas en el mapa.');
    }
    
    try {
      // Mandamos todos los parámetros incluyendo los horarios al motor backend
      await createRoute(name, origin, destination, stops, startTime, endTime, parseInt(frequency));
      if (Platform.OS === 'web') alert('¡Ruta creada exitosamente!');
      else Alert.alert('Éxito', '¡Ruta de transporte creada con todas sus paradas!');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'No se pudo crear la ruta.');
    }
  };

  const handleDelete = async (routeId: number) => {
    try {
      await deleteRoute(routeId);
      if (Platform.OS === 'web') alert('¡Ruta eliminada!');
      else Alert.alert('Éxito', 'Ruta eliminada.');
    } catch (e) {
      Alert.alert('Error', 'No se pudo eliminar la ruta.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={20} color="#34D399" />
        <Text style={styles.backButtonText}>Regresar</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Alta Masiva de Rutas</Text>
      <Text style={styles.subtitle}>Toca el mapa para ir uniendo paradas automáticamente.</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Nombre de la Ruta</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Ej. Bowí, Tarahumara" 
          placeholderTextColor="#64748B"
          value={name}
          onChangeText={setName}
        />

        <View style={{flexDirection: 'row', gap: 10}}>
          <View style={{flex: 1}}>
            <Text style={styles.label}>Origen</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Ej. Norte" 
              placeholderTextColor="#64748B"
              value={origin}
              onChangeText={setOrigin}
            />
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.label}>Destino</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Ej. Centro" 
              placeholderTextColor="#64748B"
              value={destination}
              onChangeText={setDestination}
            />
          </View>
        </View>

        <View style={{flexDirection: 'row', gap: 10, marginTop: 10}}>
          <View style={{flex: 1}}>
            <Text style={styles.label}>Inicio</Text>
            <TextInput style={styles.input} placeholder="06:00" placeholderTextColor="#64748B" value={startTime} onChangeText={setStartTime} />
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.label}>Fin</Text>
            <TextInput style={styles.input} placeholder="22:00" placeholderTextColor="#64748B" value={endTime} onChangeText={setEndTime} />
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.label}>Frec. (min)</Text>
            <TextInput style={styles.input} placeholder="15" keyboardType="numeric" placeholderTextColor="#64748B" value={frequency} onChangeText={setFrequency} />
          </View>
        </View>

        <Text style={[styles.label, {marginTop: 15}]}><Ionicons name="map" size={14}/> Trazo de Paradas: {stops.length} marcadas</Text>
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: 28.632996,
              longitude: -106.0691,
              latitudeDelta: 0.1,
              longitudeDelta: 0.1,
            }}
            onRegionChangeComplete={(region) => setCurrentCenter({ latitude: region.latitude, longitude: region.longitude })}
          >
            {stops.map((s, index) => (
              <Marker
                key={index}
                coordinate={{ latitude: s.latitude, longitude: s.longitude }}
                title={s.name}
                pinColor="#34D399"
              />
            ))}
            {stops.length > 1 && (
              <Polyline
                coordinates={stops.map(s => ({ latitude: s.latitude, longitude: s.longitude }))}
                strokeColor="#3B82F6"
                strokeWidth={4}
              />
            )}
          </MapView>
          
          {/* Marcador central fijo para apuntar con precisión */}
          <View style={styles.centerMarker} pointerEvents="none">
            <Ionicons name="add-circle" size={32} color="#EF4444" />
          </View>
          
          <TouchableOpacity style={styles.addStopBtn} onPress={handleAddStopAtCenter}>
            <Text style={styles.addStopBtnText}>+ Agregar Parada Aquí</Text>
          </TouchableOpacity>
        </View>
        
        {stops.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={() => setStops([])}>
            <Text style={styles.clearBtnText}>Borrar trazo de mapa</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.submitBtn} onPress={handleCreate}>
          <Text style={styles.submitBtnText}>Guardar Ruta y Paradas</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.title, {marginTop: 40, fontSize: 18}]}>Rutas Activas en Servidor</Text>
      
      {routes.map((rt) => {
        // Las rutas del 1 al 5 son las rutas sembradas por defecto (inborrables)
        const isDefault = rt.id <= 5;
        
        return (
          <View key={rt.id} style={styles.routeCard}>
            <View style={{flex: 1}}>
              <Text style={styles.routeName}>
                <Ionicons name="bus" size={14} color="#34D399"/> {rt.name} {isDefault && <Ionicons name="shield-checkmark" size={14} color="#3B82F6"/>}
              </Text>
              <Text style={styles.routeDetail}>{rt.origin} ➔ {rt.destination}</Text>
            </View>
            {!isDefault && (
              <TouchableOpacity onPress={() => handleDelete(rt.id)} style={styles.deleteIconBtn}>
                <Ionicons name="trash" size={20} color="#EF4444" />
              </TouchableOpacity>
            )}
            {isDefault && (
              <View style={[styles.deleteIconBtn, {backgroundColor: 'transparent'}]}>
                <Ionicons name="lock-closed" size={18} color="#64748B" />
              </View>
            )}
          </View>
        );
      })}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 20 },
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backButtonText: { color: '#34D399', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#F8FAFC', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#94A3B8', marginBottom: 20 },
  formGroup: { backgroundColor: '#1E293B', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  label: { color: '#CBD5E1', fontSize: 12, textTransform: 'uppercase', marginBottom: 8, fontWeight: 'bold' },
  input: { backgroundColor: '#0F172A', color: '#FFF', borderRadius: 8, padding: 12, marginBottom: 15, borderWidth: 1, borderColor: '#475569' },
  mapContainer: { height: 250, borderRadius: 8, overflow: 'hidden', marginBottom: 10, borderWidth: 1, borderColor: '#475569' },
  map: { width: '100%', height: '100%' },
  clearBtn: { alignItems: 'center', marginBottom: 15 },
  clearBtnText: { color: '#EF4444', fontSize: 12, fontWeight: 'bold' },
  submitBtn: { backgroundColor: '#34D399', padding: 16, borderRadius: 8, alignItems: 'center' },
  submitBtnText: { color: '#0F172A', fontWeight: 'bold', fontSize: 16 },
  
  routeCard: { flexDirection: 'row', backgroundColor: '#1E293B', padding: 15, borderRadius: 8, marginBottom: 10, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  routeName: { color: '#F8FAFC', fontSize: 16, fontWeight: 'bold' },
  routeDetail: { color: '#94A3B8', fontSize: 12, marginTop: 4 },
  deleteIconBtn: { padding: 10, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 8 },
  centerMarker: { position: 'absolute', top: '50%', left: '50%', marginLeft: -16, marginTop: -16 },
  addStopBtn: { position: 'absolute', bottom: 10, alignSelf: 'center', backgroundColor: '#0F172A', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#34D399' },
  addStopBtnText: { color: '#34D399', fontWeight: 'bold', fontSize: 12 }
});
