import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import MapComponent from '../components/MapComponent';
<<<<<<< Updated upstream
=======
import { deleteEvent } from '../api/events';
import { Ionicons } from '@expo/vector-icons';
>>>>>>> Stashed changes

export default function EventDetailScreen({ route, navigation }: any) {
  // Recibimos el evento por los parámetros de navegación
  const { event } = route.params;

  const initialRegion = {
    latitude: event.latitude,
    longitude: event.longitude,
    latitudeDelta: 0.015, // Más Zoom para ver las calles del evento
    longitudeDelta: 0.015,
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

<<<<<<< Updated upstream
=======
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

>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
=======
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

>>>>>>> Stashed changes
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
<<<<<<< Updated upstream
          <Text style={styles.backButtonText}>Volver</Text>
=======
          <Text style={styles.backButtonText}><Ionicons name="arrow-back" size={16} color="#CBD5E1" /> Volver al Mapa</Text>
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
=======
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
>>>>>>> Stashed changes
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
