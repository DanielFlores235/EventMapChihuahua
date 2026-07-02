import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function IntroScreen({ navigation }: any) {
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Ionicons name="business" size={80} color="#34D399" style={styles.logoIcon} />
        <Text style={styles.title}>CHIHUAHUA</Text>
        <Text style={styles.subtitle}>LENS</Text>
        <Text style={styles.tagline}>PRECISIÓN URBANA</Text>

        <TouchableOpacity 
          style={styles.enterButton}
          onPress={() => navigation.replace('Map')}
        >
          <Text style={styles.enterButtonText}>INICIAR COMANDO</Text>
          <Ionicons name="chevron-forward" size={16} color="#0F172A" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoIcon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 28,
    fontWeight: '300',
    color: '#34D399',
    letterSpacing: 8,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 12,
    color: '#94A3B8',
    letterSpacing: 2,
    marginBottom: 60,
  },
  enterButton: {
    flexDirection: 'row',
    backgroundColor: '#34D399',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 4,
    alignItems: 'center',
  },
  enterButtonText: {
    color: '#0F172A',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1,
    marginRight: 8,
  }
});
