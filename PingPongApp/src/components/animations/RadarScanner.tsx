import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const RadarScanner: React.FC = () => {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => { 
    Animated.loop(Animated.timing(spin, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true })).start(); 
  }, []);
  
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.container}>
      <View style={styles.circle} />
      <View style={[styles.circle, { width: 100, height: 100 }]} />
      <Animated.View style={[styles.sweep, { transform: [{ rotate }] }]}>
        <LinearGradient colors={['rgba(239, 68, 68, 0)', 'rgba(239, 68, 68, 0.2)']} style={styles.gradient} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: 150, height: 150, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  circle: { position: 'absolute', width: 150, height: 150, borderRadius: 75, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' },
  sweep: { position: 'absolute', width: 150, height: 150, borderRadius: 75, overflow: 'hidden' },
  gradient: { width: 150, height: 75, backgroundColor: 'transparent' },
});

export default RadarScanner;