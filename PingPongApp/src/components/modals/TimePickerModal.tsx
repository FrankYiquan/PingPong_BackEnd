import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { TIME_SLOTS } from '../../constants/data';

interface Props {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSelect: (time: string) => void;
}

const TimePickerModal: React.FC<Props> = ({ visible, title, onClose, onSelect }) => (
  <Modal visible={visible} animationType="fade" transparent>
    <View style={styles.overlay}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose}><Feather name="x" size={24} color={COLORS.textSec} /></TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          {TIME_SLOTS.map((time, index) => (
            <TouchableOpacity key={index} style={styles.row} onPress={() => onSelect(time)}>
              <Text style={styles.text}>{time}</Text>
              <Feather name="clock" size={16} color={COLORS.textSec} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  card: { width: '85%', maxHeight: 400, backgroundColor: 'white', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  row: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: COLORS.border, flexDirection: 'row', justifyContent: 'space-between' },
  text: { fontSize: 16, fontWeight: '600', color: COLORS.text },
});

export default TimePickerModal;