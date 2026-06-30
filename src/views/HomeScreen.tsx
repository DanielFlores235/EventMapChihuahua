import React, { useEffect, useState } from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  Text, 
  TouchableOpacity 
} from 'react-native';
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
      <Text style={styles.emptyIcon}>📍</Text>
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
          <Text style={styles.addButtonText}>➕ Crear</Text>
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
        <Text style={styles.mapFloatingButtonText}>🗺️ Ver en Mapa</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { marginTop: 12, fontSize: 15, color: '#64748B', fontWeight: '500' },
  
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  header: { fontSize: 24, fontWeight: 'bold', color: '#0F172A' },
  subHeader: { fontSize: 13, color: '#64748B', marginTop: 2 },
  
  addButton: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  addButtonText: {
    color: '#1D4ED8',
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
  emptyIcon: { fontSize: 50, marginBottom: 15 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  emptyButton: {
    backgroundColor: '#1E90FF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  emptyButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },

  // Botón flotante
  mapFloatingButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  mapFloatingButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
