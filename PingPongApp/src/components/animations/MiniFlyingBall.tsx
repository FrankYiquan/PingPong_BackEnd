import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

interface Props {
  active: boolean;
}

const MiniFlyingBall: React.FC<Props> = ({ active }) => {
  const position = useRef(new Animated.ValueXY({ x: -100, y: -100 })).current;
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      position.setValue({ x: -50, y: height * 0.4 });
      Animated.sequence([
        Animated.parallel([
          Animated.timing(position, { toValue: { x: width * 0.8, y: height * 0.6 }, duration: 500, useNativeDriver: true }),
          Animated.timing(rotation, { toValue: 1, duration: 500, useNativeDriver: true })
        ]),
        Animated.parallel([
          Animated.timing(position, { toValue: { x: width * 0.2, y: height * 0.3 }, duration: 400, useNativeDriver: true }),
          Animated.timing(rotation, { toValue: 2, duration: 400, useNativeDriver: true })
        ]),
        Animated.parallel([
          Animated.timing(position, { toValue: { x: width + 50, y: height * 0.5 }, duration: 400, useNativeDriver: true }),
          Animated.timing(rotation, { toValue: 3, duration: 400, useNativeDriver: true })
        ])
      ]).start();
    }
  }, [active]);

  const rotateStr = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  if (!active) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateX: position.x }, { translateY: position.y }, { rotate: rotateStr }] }]}>
      <LinearGradient colors={[COLORS.ballStart, COLORS.ballEnd]} style={styles.gradient}>
        <View style={styles.line} /><View style={styles.shine} />
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { position: 'absolute', width: 40, height: 40, zIndex: 999 },
  gradient: { flex: 1, borderRadius: 20, overflow: 'hidden' },
  line: { position: 'absolute', top: 19, width: 40, height: 2, backgroundColor: 'rgba(0,0,0,0.2)', transform: [{rotate:'45deg'}] },
  shine: { position: 'absolute', top: 5, left: 5, width: 12, height: 8, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 4 },
});

export default MiniFlyingBall;