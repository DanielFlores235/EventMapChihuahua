import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Platform 
} from 'react-native';
import MapComponent from '../components/MapComponent';
<<<<<<< Updated upstream
import { createEvent, geocodeAddress, reverseGeocode } from '../api/events';
=======
import { createEvent, updateEvent, geocodeAddress, reverseGeocode } from '../api/events';
import { Ionicons } from '@expo/vector-icons';
>>>>>>> Stashed changes

const CATEGORIES = ['Música', 'Cultura', 'Tecnología', 'Deportes', 'Otros'];

export default function CreateEventScreen({ navigation, route }: any) {
  // Coordenadas iniciales (Centro de Chihuahua)
  const initialLat = route.params?.latitude ?? 28.6353;
  const initialLng = route.params?.longitude ?? -106.0889;

  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Formato YYYY-MM-DD
  const [category, setCategory] = useState('Otros');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number>(initialLat);
  const [longitude, setLongitude] = useState<number>(initialLng);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const initialRegion = {
    latitude: initialLat,
    longitude: initialLng,
    latitudeDelta: 0.04,
    longitudeDelta: 0.04,
  };

  // Manejar el click en el mapa para ubicar el marcador y obtener la dirección
  const handleMapPress = async (coords: { latitude: number; longitude: number }) => {
    setLatitude(coords.latitude);
    setLongitude(coords.longitude);
    setStatusMessage({ text: 'Obteniendo dirección desde OpenStreetMap...', type: 'info' });
    
    try {
      const data = await reverseGeocode(coords.latitude, coords.longitude);
      if (data && data.address) {
        setAddress(data.address);
        setStatusMessage(null);
      }
    } catch (error) {
      setStatusMessage({ text: 'Ubicación seleccionada. No se pudo obtener la dirección exacta.', type: 'info' });
    }
  };

  // Buscar dirección por texto (Geocodificación)
  const handleSearchAddress = async () => {
    if (!address.trim()) {
      setStatusMessage({ text: 'Por favor, ingresa una dirección para buscar.', type: 'error' });
      return;
    }

    setIsSearching(true);
    setStatusMessage({ text: 'Buscando coordenadas en OpenStreetMap...', type: 'info' });

    try {
      const data = await geocodeAddress(address);
      setLatitude(data.latitude);
      setLongitude(data.longitude);
      // Actualizamos al formato oficial
      setAddress(data.address);
      setStatusMessage({ text: 'Dirección encontrada con éxito.', type: 'success' });
    } catch (error) {
      setStatusMessage({ text: 'No se encontraron coordenadas para esta dirección. Intenta ser más específico.', type: 'error' });
    } finally {
      setIsSearching(false);
    }
  };

  // Guardar el evento en el backend
  const handleSaveEvent = async () => {
    if (!name.trim()) {
      setStatusMessage({ text: 'El nombre del evento es requerido.', type: 'error' });
      return;
    }
    if (!date.trim()) {
      setStatusMessage({ text: 'La fecha es requerida (YYYY-MM-DD).', type: 'error' });
      return;
    }

    setIsLoading(true);
    setStatusMessage({ text: 'Guardando evento...', type: 'info' });

    try {
      await createEvent({
        name,
        date,
        category,
        latitude,
        longitude,
        address: address.trim() || undefined
      });
      
      setStatusMessage({ text: '¡Evento creado con éxito!', type: 'success' });
      
      // Esperar un momento y regresar al mapa
      setTimeout(() => {
        navigation.navigate('Map');
      }, 1000);
    } catch (error) {
      setStatusMessage({ text: 'Error al intentar guardar el evento en el servidor.', type: 'error' });
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}><Ionicons name="information-circle" size={16} color="#F8FAFC" /> Información General</Text>
        
        {/* Nombre del Evento */}
        <Text style={styles.label}><Ionicons name="text" size={14} color="#CBD5E1" /> Nombre del Evento *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej. Concierto Sinfónico en el Palomar"
          value={name}
          onChangeText={setName}
        />

        {/* Fecha */}
        <Text style={styles.label}><Ionicons name="calendar" size={14} color="#CBD5E1" /> Fecha (AAAA-MM-DD) *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej. 2026-10-15"
          placeholderTextColor="#64748B"
          value={date}
          onChangeText={setDate}
        />

<<<<<<< Updated upstream
=======
        {/* Horarios */}
        <View style={styles.timeRow}>
          <View style={[styles.timeInputContainer, { marginRight: 8 }]}>
            <Text style={styles.label}><Ionicons name="time" size={14} color="#CBD5E1" /> Inicio</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. 19:00"
              placeholderTextColor="#64748B"
              value={startTime}
              onChangeText={setStartTime}
            />
          </View>
          <View style={[styles.timeInputContainer, { marginLeft: 8 }]}>
            <Text style={styles.label}><Ionicons name="time" size={14} color="#CBD5E1" /> Fin</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. 22:00"
              placeholderTextColor="#64748B"
              value={endTime}
              onChangeText={setEndTime}
            />
          </View>
        </View>

>>>>>>> Stashed changes
        {/* Categorías */}
        <Text style={styles.label}><Ionicons name="pricetag" size={14} color="#CBD5E1" /> Categoría</Text>
        <View style={styles.categoryContainer}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryBadge,
                category === cat && styles.categoryBadgeSelected
              ]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[
                styles.categoryText,
                category === cat && styles.categoryTextSelected
              ]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}><Ionicons name="map" size={16} color="#F8FAFC" /> Ubicación del Evento</Text>
        <Text style={styles.helperText}>
          Escribe una dirección y presiona "Buscar" o presiona directamente sobre el mapa para marcar el punto del evento.
        </Text>

        {/* Buscador de Dirección */}
        <Text style={styles.label}><Ionicons name="business" size={14} color="#CBD5E1" /> Dirección / Lugar</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={[styles.input, styles.searchInput]}
            placeholder="Ej. Palacio del Sol, Chihuahua"
            placeholderTextColor="#64748B"
            value={address}
            onChangeText={setAddress}
          />
          <TouchableOpacity 
            style={styles.searchButton} 
            onPress={handleSearchAddress}
            disabled={isSearching}
          >
            {isSearching ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.searchButtonText}><Ionicons name="search" size={16} color="#FFF" /> Buscar</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Coordenadas en formato de lectura */}
        <View style={styles.coordsRow}>
          <Text style={styles.coordsText}>Lat: {latitude.toFixed(6)}</Text>
          <Text style={styles.coordsText}>Lng: {longitude.toFixed(6)}</Text>
        </View>

        {/* Mapa Interactivo */}
        <View style={styles.mapContainer}>
          <MapComponent
            initialRegion={initialRegion}
            userLocation={null}
            events={[]}
            onSelectEvent={() => {}}
            onMapPress={handleMapPress}
            selectedCoords={{ latitude, longitude }}
          />
        </View>
      </View>

      {/* Mensaje de Estado */}
      {statusMessage && (
        <View style={[
          styles.statusBanner,
          statusMessage.type === 'error' && styles.statusError,
          statusMessage.type === 'success' && styles.statusSuccess,
          statusMessage.type === 'info' && styles.statusInfo
        ]}>
          <Text style={styles.statusText}>{statusMessage.text}</Text>
        </View>
      )}

      {/* Botones de Acción */}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleSaveEvent}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.saveButtonText}><Ionicons name="save" size={16} color="#FFF" /> {editingEvent ? 'Actualizar' : 'Guardar Evento'}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={() => navigation.goBack()}
          disabled={isLoading}
        >
          <Text style={styles.cancelButtonText}><Ionicons name="close" size={16} color="#CBD5E1" /> Cancelar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  formCard: {
    backgroundColor: '#1E293B',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginTop: 15,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#F8FAFC',
    marginBottom: 16,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  categoryBadge: {
    backgroundColor: '#0F172A',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  categoryBadgeSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  categoryText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: '#F8FAFC',
    fontWeight: 'bold',
  },
  helperText: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 15,
    lineHeight: 18,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    marginBottom: 0,
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  coordsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  coordsText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#94A3B8',
    fontSize: 13,
  },
  mapContainer: {
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
    marginTop: 5,
  },
  statusBanner: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    marginHorizontal: 20,
  },
  statusError: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  statusSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  statusInfo: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  statusText: {
    fontSize: 14,
    color: '#F8FAFC',
    textAlign: 'center',
    fontWeight: '500',
  },
  actions: {
    marginBottom: 40,
    marginHorizontal: 20,
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 12,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  cancelButtonText: {
    color: '#CBD5E1',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
