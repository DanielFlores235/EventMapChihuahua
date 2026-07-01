import React, { useEffect, useState } from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  Text, 
  TouchableOpacity 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EventCard } from '../components/EventCard';
import { useEvents } from '../hooks/useEvents';
import { useLocation } from '../hooks/useLocation';

export default function HomeScreen({ navigation }: any) {
  const { location } = useLocation();
  const { events, loadNearbyEvents, isLoadingEvents } = useEvents();
  const [refreshing, setRefreshing] = useState(false);

  // Carga inicial
  useEffect(() => {
    if (location) {
      loadNearbyEvents(location.coords.latitude, location.coords.longitude);
    }
  }, [location, loadNearbyEvents]);

  // Pull to refresh
  const handleRefresh = async () => {
    if (location) {
      setRefreshing(true);
      await loadNearbyEvents(location.coords.latitude, location.coords.longitude);
      setRefreshing(false);
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="location" size={50} color="#3B82F6" style={{ marginBottom: 15 }} />
      <Text style={styles.emptyTitle}>Sin eventos a la redonda</Text>
      <Text style={styles.emptyText}>
        No encontramos eventos a menos de 10 km de tu ubicación. ¡Crea el primer evento para comenzar!
      </Text>
      <TouchableOpacity 
        style={styles.emptyButton}
        onPress={() => navigation.navigate('CreateEvent')}
      >
        <Text style={styles.emptyButtonText}>Crear Evento</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoadingEvents && events.length === 0 && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E90FF" />
        <Text style={styles.loadingText}>Buscando eventos cercanos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Cabecera */}
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.header}>Explorar Eventos</Text>
          <Text style={styles.subHeader}>Chihuahua, Chih.</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateEvent')}
        >
          <Text style={styles.addButtonText}><Ionicons name="add" size={16} color="#FFF" /> Crear</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Eventos */}
      <FlatList
        data={events}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <EventCard 
            event={item} 
            onPress={() => navigation.navigate('EventDetail', { event: item })} 
          />
        )}
        contentContainerStyle={[styles.list, events.length === 0 && { flex: 1 }]}
        ListEmptyComponent={renderEmptyState}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />

      {/* Botón flotante para ver en el Mapa */}
      <TouchableOpacity 
        style={styles.mapFloatingButton}
        onPress={() => navigation.navigate('Map')}
        activeOpacity={0.8}
      >
        <Text style={styles.mapFloatingButtonText}><Ionicons name="map" size={16} color="#FFF" /> Ver en Mapa</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' },
  loadingText: { marginTop: 12, fontSize: 15, color: '#94A3B8', fontWeight: '500' },
  
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  header: { fontSize: 24, fontWeight: 'bold', color: '#F8FAFC' },
  subHeader: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  
  addButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },

  list: { paddingBottom: 100, paddingTop: 10 },

  // Estilos Estado Vacío
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 60,
  },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#F8FAFC', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#CBD5E1', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  emptyButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  emptyButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },

  // Botón flotante
  mapFloatingButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  mapFloatingButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
