import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { Match } from '../../constants/data';
import { useAuth } from '@/src/context/AuthContext';
import { API_URL } from '@/src/constants/config';

interface VProps {
  label: string;
  score: number;
  setScore: (n: number) => void;
}

const VerticalScoreInput: React.FC<VProps> = ({ label, score, setScore }) => (
  <View style={styles.vScoreContainer}>
    <Text style={styles.vScoreLabel}>{label}</Text>
    <View style={styles.vScoreBox}>
      <TouchableOpacity onPress={() => setScore(Math.max(0, score - 1))} style={styles.vBtn}>
        <Feather name="minus" size={24} color={COLORS.text} />
      </TouchableOpacity>
      <Text style={styles.vScoreNum}>{score}</Text>
      <TouchableOpacity onPress={() => setScore(score + 1)} style={styles.vBtn}>
        <Feather name="plus" size={24} color={COLORS.text} />
      </TouchableOpacity>
    </View>
  </View>
);

interface Props {
  visible: boolean;
  match: Match | null;
  onClose: () => void;
}

const ScoreModal: React.FC<Props> = ({ visible, match, onClose }) => {
  const { userToken, refreshUser } = useAuth();
  const [myScore, setMyScore] = useState(0);
  const [opScore, setOpScore] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!userToken) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/match/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userToken}` },
        body: JSON.stringify({ matchId: match!.id, myScore, opponentScore: opScore })
      });
      if (!res.ok) throw new Error("Failed to submit");
      
      Alert.alert("Success", "Score submitted!");
      await refreshUser(userToken); // Refresh profile data
      onClose();
    } catch (e) {
      Alert.alert("Error", "Could not submit score");
    } finally {
      setLoading(false);
    }
  };

  if (!match) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Match Result</Text>
            <TouchableOpacity onPress={onClose}><Feather name="x" size={24} color={COLORS.textSec} /></TouchableOpacity>
          </View>
          <Text style={styles.sub}>Final set vs {match.opponent}</Text>
          <View style={styles.body}>
            <VerticalScoreInput label="YOU" score={myScore} setScore={setMyScore} />
            <Text style={styles.colon}>:</Text>
            <VerticalScoreInput label={match.opponent.split(' ')[0]} score={opScore} setScore={setOpScore} />
          </View>
          <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>SUBMIT SCORE</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  card: { width: '85%', backgroundColor: 'white', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  sub: { color: COLORS.textSec, marginBottom: 20, fontSize: 14 },
  body: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 },
  colon: { color: COLORS.textSec, fontSize: 30, fontWeight: 'bold', marginHorizontal: 10 },
  btn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  vScoreContainer: { alignItems: 'center', width: 80 },
  vScoreLabel: { color: COLORS.text, fontWeight: 'bold', marginBottom: 15 },
  vScoreBox: { backgroundColor: '#F1F5F9', borderRadius: 16, width: '100%', paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  vBtn: { padding: 10 },
  vScoreNum: { fontSize: 36, fontWeight: 'bold', marginVertical: 5, color: COLORS.text },
});

export default ScoreModal;