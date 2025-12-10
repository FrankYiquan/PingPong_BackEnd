import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { Match } from '../../constants/data';

interface Props {
  visible: boolean;
  match: Match | null;
  onClose: () => void;
  onConfirmCancel: (matchId: string) => void;
}

const { width } = Dimensions.get('window');

const CancelMatchModal: React.FC<Props> = ({ visible, match, onClose, onConfirmCancel }) => {
  if (!match) return null;

  // --- 1. Calculate 48 Hour Warning Logic ---
  const isLateCancellation = () => {
    try {
      // Combine date and time string into a Date object
      // Assumes format "MM/DD/YYYY" and "HH:MM PM"
      const matchDateStr = `${match.date} ${match.time}`;
      const matchDate = new Date(matchDateStr);
      const now = new Date();

      // Difference in hours
      const diffMs = matchDate.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      return diffHours < 48;
    } catch (e) {
      return false; // Fallback
    }
  };

  const showWarning = isLateCancellation();

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          
          {/* Icon Header */}
          <View style={[styles.iconCircle, { backgroundColor: showWarning ? '#FEF2F2' : '#EFF6FF' }]}>
            <MaterialCommunityIcons 
              name={showWarning ? "alert-decagram" : "calendar-remove"} 
              size={32} 
              color={showWarning ? COLORS.danger : COLORS.primary} 
            />
          </View>

          <Text style={styles.title}>Cancel Match?</Text>
          <Text style={styles.sub}>
            You are about to cancel your game vs <Text style={{fontWeight:'bold', color: COLORS.text}}>{match.opponent}</Text>.
          </Text>

          {/* --- THE WARNING --- */}
          {showWarning && (
            <View style={styles.warningBox}>
              <Feather name="alert-triangle" size={18} color="#B91C1C" />
              <View style={{flex:1}}>
                <Text style={styles.warningTitle}>Less than 48 hours left</Text>
                <Text style={styles.warningText}>
                  Canceling now will <Text style={{fontWeight:'bold'}}>decrease your Credit Score</Text>.
                </Text>
              </View>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity onPress={onClose} style={styles.btnCancel}>
              <Text style={styles.btnCancelText}>Keep Match</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => onConfirmCancel(match.id as string)} 
              style={[styles.btnConfirm, { backgroundColor: showWarning ? COLORS.danger : COLORS.textSec }]}
            >
              <Text style={styles.btnConfirmText}>Yes, Cancel</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'center', alignItems: 'center' },
  card: { width: width * 0.85, backgroundColor: 'white', borderRadius: 24, padding: 24, alignItems: 'center' },
  iconCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '900', color: COLORS.text, marginBottom: 8 },
  sub: { fontSize: 14, color: COLORS.textSec, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  
  warningBox: { flexDirection: 'row', backgroundColor: '#FEF2F2', padding: 12, borderRadius: 12, width: '100%', gap: 10, borderWidth: 1, borderColor: '#FECACA', marginBottom: 24 },
  warningTitle: { color: '#991B1B', fontWeight: 'bold', fontSize: 13, marginBottom: 2 },
  warningText: { color: '#7F1D1D', fontSize: 12 },

  actionRow: { flexDirection: 'row', width: '100%', gap: 12 },
  btnCancel: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: COLORS.bg, alignItems: 'center' },
  btnCancelText: { fontWeight: 'bold', color: COLORS.text },
  btnConfirm: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  btnConfirmText: { fontWeight: 'bold', color: 'white' }
});

export default CancelMatchModal;