import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { DATES } from '../../constants/data';
import TimePickerModal from './TimePickerModal';
import { calculateMatchTimes } from '../../utils/dateHelper';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../constants/config';

interface Props {
  visible: boolean;
  opponentId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const ChallengeModal: React.FC<Props> = ({ visible, opponentId, onClose, onSuccess }) => {
  const { userToken } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Reuse PlayScreen Logic
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedCourt, setSelectedCourt] = useState(1);
  const [startTime, setStartTime] = useState("6:00 PM");
  const [endTime, setEndTime] = useState("7:30 PM");
  
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [activeTimeField, setActiveTimeField] = useState<'start'|'end'>('start');

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { start, end } = calculateMatchTimes(selectedDate, startTime, endTime);
      const locationMap: Record<number, string> = { 1: "Gosman", 2: "Shapiro", 3: "IBS" };

      const res = await fetch(`${API_URL}/match/challenge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userToken}` },
        body: JSON.stringify({
          opponentId,
          location: locationMap[selectedCourt],
          startTime: start.toISOString(),
          endTime: end.toISOString()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      Alert.alert("Success", "Game scheduled successfully!");
      onSuccess();
      onClose();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeSelect = (val: string) => {
    if(activeTimeField === 'start') setStartTime(val);
    else setEndTime(val);
    setTimePickerVisible(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Setup Game</Text>
            <TouchableOpacity onPress={onClose}><Feather name="x" size={24} color={COLORS.text} /></TouchableOpacity>
          </View>

          {/* Date Scroller */}
          <Text style={styles.label}>Select Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{marginBottom: 15}}>
            {DATES.map((d) => (
              <TouchableOpacity key={d.id} style={[styles.dateBox, selectedDate === d.id && styles.activeBox]} onPress={() => setSelectedDate(d.id)}>
                <Text style={[styles.dateTxt, selectedDate === d.id && styles.activeTxt]}>{d.day}</Text>
                <Text style={[styles.dateNum, selectedDate === d.id && styles.activeTxt]}>{d.date}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Time Picker */}
          <Text style={styles.label}>Select Time</Text>
          <View style={styles.row}>
            <TouchableOpacity style={styles.pill} onPress={() => {setActiveTimeField('start'); setTimePickerVisible(true)}}><Text>{startTime}</Text></TouchableOpacity>
            <Text>-</Text>
            <TouchableOpacity style={styles.pill} onPress={() => {setActiveTimeField('end'); setTimePickerVisible(true)}}><Text>{endTime}</Text></TouchableOpacity>
          </View>

          {/* Court Picker */}
          <Text style={styles.label}>Select Court</Text>
          <View style={styles.row}>
            {[1, 2, 3].map(id => (
              <TouchableOpacity key={id} style={[styles.courtPill, selectedCourt === id && styles.activeBox]} onPress={() => setSelectedCourt(id)}>
                <Text style={[selectedCourt === id ? styles.activeTxt : {color: COLORS.text}]}>{id === 1 ? "Gosman" : id === 2 ? "Shapiro" : "IBS"}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.submitTxt}>CONFIRM MATCH</Text>}
          </TouchableOpacity>
        </View>
      </View>

      <TimePickerModal visible={timePickerVisible} title="Select Time" onClose={() => setTimePickerVisible(false)} onSelect={handleTimeSelect} />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  card: { width: '90%', backgroundColor: 'white', borderRadius: 20, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 'bold' },
  label: { fontSize: 12, color: COLORS.textSec, fontWeight: 'bold', marginBottom: 8, marginTop: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateBox: { width: 50, height: 60, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, marginRight: 8, alignItems: 'center', justifyContent: 'center' },
  activeBox: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dateTxt: { fontSize: 10, color: COLORS.textSec },
  dateNum: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  activeTxt: { color: 'white' },
  pill: { padding: 12, backgroundColor: COLORS.bg, borderRadius: 10, width: '45%', alignItems: 'center' },
  courtPill: { padding: 10, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, width: '30%', alignItems: 'center' },
  submitBtn: { marginTop: 25, backgroundColor: COLORS.primary, padding: 15, borderRadius: 15, alignItems: 'center' },
  submitTxt: { color: 'white', fontWeight: 'bold' }
});

export default ChallengeModal;