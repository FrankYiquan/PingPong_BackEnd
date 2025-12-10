import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, Modal, SafeAreaView, 
  StyleSheet, RefreshControl, Image, Alert, Platform, StatusBar 
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';
import { images, Match } from '../constants/data';
import ScoreModal from '../components/modals/ScoreModal';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/modals/AuthModal';
import { useFocusEffect } from '@react-navigation/native';
import { generateLetterCreditScore } from '../utils/dateHelper';
import CancelMatchModal from '../components/modals/CancelMatchModal'; 
import { API_URL } from '../constants/config';
import QRCode from 'react-native-qrcode-svg'; 
import ScannerModal from '../components/modals/ScannerModal';
import ChallengeModal from '../components/modals/ChallengeModal';


const ProfileScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [showMyQR, setShowMyQR] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null); 
  const [matchToCancel, setMatchToCancel] = useState<Match | null>(null); 
  const [authVisible, setAuthVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [scannedOpponentId, setScannedOpponentId] = useState<string | null>(null);
  const [showChallengeModal, setShowChallengeModal] = useState(false);

  // 1. GET LOGOUT FUNCTION
  const { userData, refreshUser, userToken, logout } = useAuth();

  useFocusEffect(
    useCallback(() => {
      if (userToken) refreshUser(userToken);
    }, [userToken])
  );

  useEffect(() => {
    if (!userToken) setAuthVisible(true);
    else setAuthVisible(false);
  }, [userToken]);

  const onPullRefresh = async () => {
    if (userToken) {
      setRefreshing(true);
      await refreshUser(userToken);
      setRefreshing(false);
    }
  };

  // 2. ADD LOGOUT HANDLER
  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Log Out", 
          style: "destructive", 
          onPress: async () => {
            await logout();
            // The useEffect above will trigger setAuthVisible(true) automatically
          } 
        }
      ]
    );
  };

  const handleCancelConfirm = async (matchId: string) => {
    setMatchToCancel(null); 
    try {
      const res = await fetch(`${API_URL}/match/cancel-scheduled`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
        body: JSON.stringify({ matchId })
      });
      
      if(res.ok) {
        Alert.alert("Cancelled", "The match has been cancelled.");
        refreshUser(userToken!); 
      } else {
        Alert.alert("Error", "Could not cancel match.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Callback when scanner finds a code
  const handleScanSuccess = (data: string) => {
    // Assuming the QR code just contains the UserID string
    setScannedOpponentId(data);
    setShowChallengeModal(true); // Open the setup form
  };

  const handleChallengeSuccess = () => {
    refreshUser(userToken!); // Refresh to see the new upcoming match
  };

  // ... (renderUpcoming and renderHistory helper functions stay exactly the same) ...
  const renderUpcoming = () => {
    if (!userData.pendingMatches || userData.pendingMatches.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Feather name="calendar" size={40} color="#E2E8F0" />
          <Text style={styles.emptyText}>No upcoming matches.</Text>
          {/* <TouchableOpacity style={styles.emptyBtn}><Text style={styles.emptyBtnText}>Find a Match</Text></TouchableOpacity> */}
        </View>
      );
    }

    return userData.pendingMatches.map((match: any) => (
      <View key={match.id} style={styles.upcomingCard}>
        <View style={styles.upcomingStrip} />
        <View style={styles.upcomingContent}>
          <View style={styles.upcomingHeader}>
            <View style={{flexDirection:'row', alignItems:'center'}}>
              <Image 
                source={images[userData.avatar]} 
                style={styles.upcomingAvatar}
              />
              <View style={{marginLeft: 10}}>
                <Text style={styles.upcomingLabel}>VS</Text>
                <Text style={styles.upcomingName}>{match.opponent}</Text>
              </View>
            </View>
             <TouchableOpacity onPress={() => setMatchToCancel(match)} style={styles.cancelIconBtn}>
               <Feather name="x" size={18} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailGrid}>
            <View style={styles.detailItem}>
              <Feather name="calendar" size={14} color={COLORS.textSec} />
              <Text style={styles.detailText}>{match.date}</Text>
            </View>
            <View style={styles.detailItem}>
              <Feather name="clock" size={14} color={COLORS.textSec} />
              <Text style={styles.detailText}>{match.time}</Text>
            </View>
            <View style={styles.detailItem}>
              <Feather name="map-pin" size={14} color={COLORS.textSec} />
              <Text style={styles.detailText}>{match.location}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.scoreCta} onPress={() => setSelectedMatch(match)}>
            <Text style={styles.scoreCtaText}>Enter Result</Text>
            <Feather name="chevron-right" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    ));
  };

  const renderHistory = () => {
    if (!userData.history || userData.history.length === 0) {
      return <Text style={styles.emptyTextSimple}>No match history yet.</Text>;
    }
    return userData.history.map((item) => (
      <View key={item.id} style={styles.row}>
        <View style={[styles.badge, { backgroundColor: item.result === 'W' ? '#DCFCE7' : '#FEE2E2' }]}>
          <Text style={[styles.resText, {color: item.result === 'W' ? COLORS.success : COLORS.danger}]}>{item.result}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.opp}>vs {item.opponent}</Text>
          <Text style={styles.date}>{item.date}</Text>
        </View>
        <Text style={styles.score}>{item.score}</Text>
      </View>
    ));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onPullRefresh} tintColor={COLORS.primary} />}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.name}>{userData.name}</Text>
            <Text style={styles.sub}>Rating: {userData.elo}</Text>
          </View>
          <TouchableOpacity onPress={() => setShowMyQR(true)} style={styles.qrBtn}>
             <MaterialCommunityIcons name="qrcode" size={26} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}><Text style={styles.statLabel}>WIN RATE</Text><Text style={styles.statVal}>{userData.winRate}</Text></View>
          <View style={styles.statCard}><Text style={styles.statLabel}>CREDIT</Text><Text style={styles.statVal}>{generateLetterCreditScore(userData.creditScore || 100)}</Text></View>
          <View style={styles.statCard}><Text style={styles.statLabel}>MATCHES</Text><Text style={styles.statVal}>{userData.matches}</Text></View>
        </View>

        {/* Scan Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.scanBtn} onPress={() => setShowCamera(true)}>
            <MaterialCommunityIcons name="qrcode-scan" size={24} color={COLORS.bg} />
            <Text style={styles.scanText}>Scan Opponent QR</Text>
          </TouchableOpacity>
      </View>


        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'upcoming' && styles.tabBtnActive]} 
            onPress={() => setActiveTab('upcoming')}
          >
            <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>Upcoming</Text>
            {activeTab === 'upcoming' && <View style={styles.activeDot} />}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'history' && styles.tabBtnActive]} 
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>History</Text>
            {activeTab === 'history' && <View style={styles.activeDot} />}
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.listSection}>
          {activeTab === 'upcoming' ? renderUpcoming() : renderHistory()}
        </View>

        {/* 3. LOGOUT BUTTON */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.logoutBtn, { marginTop: 20, borderColor: COLORS.danger, borderWidth: 1 }]} 
            onPress={handleLogout}
          >
            <MaterialCommunityIcons name="logout" size={24} color={COLORS.danger} />
            <Text style={[styles.scanText, { color: COLORS.danger }]}>LOGOUT</Text>
          </TouchableOpacity>
        </View>
        
      </ScrollView>

      {/* Modals */}
      <ScoreModal visible={!!selectedMatch} match={selectedMatch} onClose={() => setSelectedMatch(null)} />
      
      <CancelMatchModal 
        visible={!!matchToCancel} 
        match={matchToCancel} 
        onClose={() => setMatchToCancel(null)} 
        onConfirmCancel={handleCancelConfirm}
      />

      {/* QR MODAL */}
      <Modal visible={showMyQR} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.qrCard}>
            <Text style={styles.qrTitle}>My Player ID</Text>
            
            <View style={styles.qrBorder}>
              {userData.id ? (
                <QRCode
                  value={userData.id} 
                  size={200}
                  color="black"
                  backgroundColor="white"
                />
              ) : (
                <Text>Loading...</Text>
              )}
            </View>

            <Text style={styles.qrSubText}>{userData.name}</Text>

            <TouchableOpacity onPress={() => setShowMyQR(false)} style={styles.closeBtn}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <ScannerModal 
        visible={showCamera} 
        onClose={() => setShowCamera(false)} 
        onScanned={handleScanSuccess} 
      />

      <ChallengeModal 
        visible={showChallengeModal} 
        opponentId={scannedOpponentId || ""} 
        onClose={() => setShowChallengeModal(false)}
        onSuccess={handleChallengeSuccess}
      />
    <AuthModal
    visible={authVisible}
    onClose={() => setAuthVisible(false)}
    onLoginSuccess={(token) => refreshUser(token)}
  />
    </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // ... (Your existing styles remain exactly the same)
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 24, alignItems: 'center' },
  name: { fontSize: 28, fontWeight: '900', color: COLORS.text },
  sub: { fontSize: 14, color: COLORS.textSec },
  qrBtn: { padding: 8, backgroundColor: COLORS.card, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  section: { paddingHorizontal: 24, marginBottom: 25 },
  scanBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: COLORS.border, shadowColor: COLORS.shadow, shadowOpacity: 0.05, shadowRadius: 5,},
  logoutBtn: { backgroundColor: COLORS.bg, padding: 16, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: COLORS.border, shadowColor: COLORS.shadow, shadowOpacity: 0.05, shadowRadius: 5 },
  scanText: { color: COLORS.bg, fontWeight: 'bold', fontSize: 16, textAlign: 'center' },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 24, marginBottom: 20, gap: 20 },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 4, position: 'relative' },
  tabBtnActive: {},
  tabText: { fontSize: 16, fontWeight: '600', color: COLORS.textSec },
  tabTextActive: { color: COLORS.primary, fontWeight: '800' },
  activeDot: { position: 'absolute', bottom: 0, left: '30%', width: '40%', height: 3, backgroundColor: COLORS.primary, borderRadius: 2 },
  listSection: { paddingHorizontal: 24 },
  upcomingCard: { backgroundColor: COLORS.card, borderRadius: 16, marginBottom: 16, flexDirection: 'row', overflow: 'hidden', shadowColor: COLORS.shadow, shadowOpacity: 0.1, shadowRadius: 10, elevation: 3 },
  upcomingStrip: { width: 6, backgroundColor: COLORS.primary },
  upcomingContent: { flex: 1, padding: 16 },
  upcomingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  upcomingAvatar: { width: 40, height: 40, borderRadius: 20 },
  upcomingLabel: { fontSize: 10, fontWeight: 'bold', color: COLORS.textSec },
  upcomingName: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  cancelIconBtn: { padding: 5, backgroundColor: '#FEF2F2', borderRadius: 8 },
  divider: { height: 1, backgroundColor: COLORS.border, marginBottom: 12 },
  detailGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 12, color: COLORS.text, fontWeight: '500' },
  scoreCta: { backgroundColor: COLORS.primary, paddingVertical: 10, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 },
  scoreCtaText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  badge: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  resText: { fontWeight: 'bold', fontSize: 12 },
  opp: { color: COLORS.text, fontWeight: 'bold', fontSize: 14 },
  date: { color: COLORS.textSec, fontSize: 12 },
  score: { color: COLORS.text, fontWeight: '600' },
  emptyState: { alignItems: 'center', padding: 30, backgroundColor: '#F8FAFC', borderRadius: 16, borderStyle: 'dashed', borderWidth: 2, borderColor: COLORS.border },
  emptyText: { color: COLORS.textSec, marginVertical: 10, fontWeight: '600' },
  emptyBtn: { paddingHorizontal: 20, paddingVertical: 8, backgroundColor: 'white', borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  emptyBtnText: { fontSize: 12, fontWeight: 'bold', color: COLORS.text },
  emptyTextSimple: { color: COLORS.textSec, fontStyle: 'italic', textAlign: 'center', marginTop: 20 },
  cancelText: { color: COLORS.danger, fontSize: 14, fontWeight: "500" },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  qrTitle: { fontSize: 18, fontWeight: 'bold' },
  closeBtn: { marginTop: 20, backgroundColor: COLORS.text, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  closeText: { color: 'white', fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 12, marginBottom: 25 },
  statCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, shadowColor: COLORS.shadow, shadowOpacity: 0.05, shadowRadius: 5 },
  statLabel: { color: COLORS.textSec, fontSize: 10, fontWeight: '700', marginBottom: 4 },
  statVal: { color: COLORS.text, fontSize: 20, fontWeight: 'bold' },
  qrCard: { 
    backgroundColor: 'white', 
    padding: 30, 
    borderRadius: 20, 
    alignItems: 'center',
    width: '85%' // Ensure consistent width
  },
  qrBorder: {
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    // Optional: Add shadow to pop the QR code out
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20
  },
  qrSubText: {
    marginTop: 10,
    color: COLORS.textSec,
    fontWeight: '600',
    fontSize: 16
  }
});

export default ProfileScreen;
