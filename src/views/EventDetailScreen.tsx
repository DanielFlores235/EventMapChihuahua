import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import MapComponent from '../components/MapComponent';

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
            <Text style={styles.detailIcon}>📅</Text>
            <View>
              <Text style={styles.detailLabel}>Fecha del evento</Text>
              <Text style={styles.detailValue}>{event.date}</Text>
            </View>
          </View>

          {event.distance && (
            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>📍</Text>
              <View>
                <Text style={styles.detailLabel}>Distancia desde ti</Text>
                <Text style={styles.detailValue}>{event.distance}</Text>
              </View>
            </View>
          )}

          {event.address && (
            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>🏠</Text>
              <View style={styles.addressWrapper}>
                <Text style={styles.detailLabel}>Dirección / Lugar</Text>
                <Text style={styles.detailValue}>{event.address}</Text>
              </View>
            </View>
          )}
        </View>
        
        {/* Mini mapa real del evento */}
        <Text style={styles.mapLabel}>Ubicación en el Mapa</Text>
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
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  card: { 
    backgroundColor: '#FFF', 
    padding: 20, 
    borderRadius: 16, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 12, 
    elevation: 3, 
    marginBottom: 20 
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 11,
    color: '#1D4ED8',
    fontWeight: 'bold',
  },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#0F172A' },
  detailsGroup: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 15,
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 15,
    color: '#334155',
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
    color: '#475569',
    marginBottom: 10,
    marginTop: 5,
  },
  mapContainer: { 
    height: 180, 
    backgroundColor: '#E2E8F0', 
    borderRadius: 12, 
    overflow: 'hidden', 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
    marginTop: 5 
  },
  actions: {
    marginBottom: 40,
  },
  backButton: {
    backgroundColor: '#0F172A',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
