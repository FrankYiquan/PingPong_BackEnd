import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/theme';

interface Props {
  onPress: () => void;
}

const PingPongBallButton: React.FC<Props> = ({ onPress }) => {
  const hoverVal = useRef(new Animated.Value(0)).current;

  useEffect(() => { 
    Animated.loop(Animated.sequence([
      Animated.timing(hoverVal, { toValue: -8, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }), 
      Animated.timing(hoverVal, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true })
    ])).start(); 
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
        <Animated.View style={[styles.wrapper, { transform: [{ translateY: hoverVal }] }]}>
          <LinearGradient colors={[COLORS.ballStart, COLORS.ballEnd]} style={styles.gradient}>
            <View style={styles.line} />
            <Text style={styles.text}>START</Text>
            <View style={styles.shine} />
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
      <Animated.View style={[styles.shadow, { transform: [{ scale: hoverVal.interpolate({inputRange:[-8,0], outputRange:[0.8, 1]}) }] }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  wrapper: { width: 170, height: 170, borderRadius: 85, zIndex: 10 },
  gradient: { flex: 1, borderRadius: 85, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  line: { position: 'absolute', width: 170, height: 2, backgroundColor: 'rgba(0,0,0,0.1)', transform: [{ rotate: '45deg' }] },
  text: { fontSize: 24, fontWeight: '900', color: '#B45309', letterSpacing: 1.5 },
  shine: { position: 'absolute', top: 20, left: 20, width: 50, height: 30, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.4)', transform: [{ rotate: '-45deg' }] },
  shadow: { width: 100, height: 20, borderRadius: 50, backgroundColor: 'rgba(0,0,0,0.1)', marginTop: 20 },
});

export default PingPongBallButton;