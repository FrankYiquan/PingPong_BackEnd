import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, Image, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { Match } from '../../constants/data'; // Removed PENDING_MATCHES_LIST

interface Props {
  visible: boolean;
  matches: Match[]; // <--- 1. Add matches prop
  onClose: () => void;
  onSelect: (match: Match) => void;
}

const MatchSelectionModal: React.FC<Props> = ({ visible, matches, onClose, onSelect }) => (
  <Modal visible={visible} animationType="slide" transparent>
    <View style={styles.overlay}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Match</Text>
          <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={24} color={COLORS.textSec} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={{maxHeight: 300}}>
          {/* 2. Check if matches exist */}
          {matches.length === 0 ? (
            <Text style={styles.emptyText}>No pending matches found.</Text>
          ) : (
            /* 3. Map over the passed 'matches' prop */
            matches.map((match) => (
              <TouchableOpacity key={match.id} style={styles.row} onPress={() => onSelect(match)}>
                <Image 
                  source={{uri: match.avatar || "https://i.pravatar.cc/150?u=default"}} 
                  style={styles.avatar} 
                />
                <View style={{flex:1, marginLeft: 12}}>
                  <Text style={styles.name}>vs {match.opponent}</Text>
                  <Text style={styles.date}>{match.date}</Text>
                </View>
                <Feather name="chevron-right" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  card: { width: '85%', backgroundColor: 'white', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eee' },
  name: { fontWeight: 'bold', color: COLORS.text, fontSize: 16 },
  date: { color: COLORS.textSec, fontSize: 12 },
  emptyText: { textAlign: 'center', color: COLORS.textSec, padding: 20, fontStyle: 'italic' }
});

export default MatchSelectionModal;