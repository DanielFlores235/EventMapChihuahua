import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Event } from '../types';

interface EventCardProps {
  event: Event;
  onPress?: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.title}>{event.name}</Text>
      
      <View style={styles.detailsContainer}>
        <Text style={styles.date}><Ionicons name="calendar" size={14} color="#94A3B8" /> {event.date}</Text>
        {event.distance && (
          <Text style={styles.distance}><Ionicons name="location" size={14} color="#3B82F6" /> a {event.distance}</Text>
        )}
      </View>
      
      {event.category && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{event.category}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    elevation: 4, // Sombra para Android
    shadowColor: '#000', // Sombra para iOS
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 8,
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  distance: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3E8FF',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    color: '#9333EA',
    fontWeight: 'bold',
  },
});