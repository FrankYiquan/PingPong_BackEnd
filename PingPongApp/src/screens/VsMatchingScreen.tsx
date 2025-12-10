import React, { useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, Image, SafeAreaView, Animated, StyleSheet, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';
import MiniFlyingBall from '../components/animations/MiniFlyingBall';
import RadarScanner from '../components/animations/RadarScanner';
import { useMatchmaking } from '../hooks/useMatchmaking'; 
import { generateLetterCreditScore } from '../utils/dateHelper';
import {useAuth} from '../context/AuthContext';
import {images} from '../constants/data';

const { width, height } = Dimensions.get('window');

interface Props {
  visible: boolean;
  matchRequestId: string | null;
  onClose: () => void;
  onMatchConfirmed: (matchData: any) => void;
}

const VsMatchingScreen: React.FC<Props> = ({ visible, matchRequestId, onClose, onMatchConfirmed }) => {
  
  // 1. USE THE CUSTOM HOOK
  const { 
    status, 
    opponent, 
    pulse, 
    flyIn, 
    fade, 
    acceptMatch, 
    declineMatch, 
    cancelSearch 
  } = useMatchmaking(matchRequestId, onMatchConfirmed, onClose);

  const { userData } = useAuth();


  // 2. Local Animation Loop for Pulse (UI Only)
  useEffect(() => {
    if (visible && status === 'searching') {
      Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue: 1.1, duration: 1000, useNativeDriver: true }), 
        Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true })
      ])).start();
    }
  }, [visible, status]);

  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={cancelSearch}>
      <View style={styles.container}>
        <MiniFlyingBall active={status === 'found'} />
        
        {/* TOP HALF */}
        <View style={styles.topHalf}>
          <SafeAreaView style={{width:'100%'}}>
             {!opponent && (
              <TouchableOpacity onPress={cancelSearch} style={styles.closeBtn}>
                <Feather name="x" size={24} color={COLORS.text} />
              </TouchableOpacity>
            )}
          </SafeAreaView>
          <View style={styles.playerBlock}>
            <Image source={images[userData.avatar]} style={[styles.avatar, {borderColor: COLORS.primary}]} />
            <Text style={styles.name}>{userData.name}</Text>
            <View style={styles.badge}><Text style={styles.badgeText}>ELO {userData.elo}</Text></View>
          </View>
          <View style={styles.diagonal} />
        </View>

        {/* VS ORB */}
        <View style={styles.orbWrapper}>
          <Animated.View style={[styles.orb, { transform: [{ scale: pulse }] }]}>
            <LinearGradient colors={[COLORS.danger, '#C2410C']} style={styles.gradient}><Text style={styles.vsText}>VS</Text></LinearGradient>
          </Animated.View>
        </View>

        {/* BOTTOM HALF */}
        <View style={styles.bottomHalf}>
          {status === 'searching' ? (
            <View style={styles.center}>
                <RadarScanner />
                <Text style={styles.searchTxt}>Scanning Area...</Text>
                <Text style={styles.subTxt}>Finding worthy opponents</Text>
            </View>
          ) : (
            <Animated.View style={[styles.center, { transform: [{ translateY: flyIn }], opacity: fade }]}>
               
               {status === 'accepted' ? (
                   <View style={{alignItems:'center', marginBottom: 20}}>
                       <Feather name="check-circle" size={50} color={COLORS.success} />
                       <Text style={[styles.searchTxt, {marginTop: 10, color: COLORS.success}]}>Waiting for Opponent...</Text>
                   </View>
               ) : (
                   <Text style={styles.foundTitle}>CHALLENGER FOUND</Text>
               )}

               <Image 
                 source={images[opponent!.profileImage]} 
                 style={[styles.avatar, {borderColor: COLORS.danger}]} 
               />
               <Text style={styles.name}>{opponent?.username}</Text>
               <Text style={styles.badgeText}>Credit Rating: {generateLetterCreditScore(opponent!.creditScore)}</Text>
               
               {status === 'found' && (
                   <View style={styles.actions}>
                      <TouchableOpacity style={styles.reject} onPress={declineMatch}><Feather name="x" size={30} color={COLORS.danger} /></TouchableOpacity>
                      <TouchableOpacity style={styles.fight} onPress={acceptMatch}><Text style={styles.fightText}>FIGHT</Text></TouchableOpacity>
                   </View>
               )}
            </Animated.View>
          )}
        </View>
      </View>
    </Modal>
  );
};

// ... Styles remain exactly the same as before
const styles = StyleSheet.create({
  // ... (copy styles from previous message)
  container: { flex: 1, backgroundColor: COLORS.bg },
  topHalf: { flex: 1, backgroundColor: COLORS.vsBlue, justifyContent: 'center', alignItems: 'center', paddingBottom: 40, position: 'relative', overflow: 'hidden' },
  diagonal: { position: 'absolute', bottom: -50, left: -50, width: width + 100, height: 100, backgroundColor: COLORS.vsRed, transform: [{ rotate: '-5deg' }], zIndex: 0 },
  closeBtn: { alignSelf: 'flex-end', marginRight: 20, marginTop: 10, backgroundColor: 'rgba(255,255,255,0.5)', padding: 8, borderRadius: 20 },
  playerBlock: { alignItems: 'center', zIndex: 10 },
  avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 4, backgroundColor: '#DDD', marginBottom: 15 },
  name: { fontSize: 28, fontWeight: '900', color: COLORS.text },
  badge: { backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginTop: 8 },
  badgeText: { fontWeight: 'bold', color: COLORS.textSec, fontSize: 12 },
  orbWrapper: { position: 'absolute', top: height * 0.5 - 40, left: width * 0.5 - 40, zIndex: 50 },
  orb: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.card, padding: 5, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 10 },
  gradient: { flex: 1, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  vsText: { color: 'white', fontWeight: '900', fontSize: 26, fontStyle: 'italic' },
  bottomHalf: { flex: 1, backgroundColor: COLORS.vsRed, justifyContent: 'center', alignItems: 'center', paddingTop: 40 },
  center: { alignItems: 'center', width: '100%' },
  searchTxt: { fontSize: 20, fontWeight: 'bold', color: COLORS.danger },
  subTxt: { color: COLORS.textSec, opacity: 0.7 },
  foundTitle: { color: COLORS.danger, fontWeight: '900', letterSpacing: 2, marginBottom: 20, fontSize: 14 },
  actions: { flexDirection: 'row', gap: 20, alignItems: 'center', marginTop: 30 },
  reject: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  fight: { width: 140, height: 60, backgroundColor: '#0F172A', borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5 },
  fightText: { color: 'white', fontWeight: '900', fontSize: 20, letterSpacing: 1 },
});

export default VsMatchingScreen;