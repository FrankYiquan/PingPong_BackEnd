import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera'; // Modern Expo Camera
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  visible: boolean;
  onClose: () => void;
  onScanned: (data: string) => void;
}

const ScannerModal: React.FC<Props> = ({ visible, onClose, onScanned }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (visible) {
      setScanned(false); // Reset scan state when opening
      if (!permission?.granted) requestPermission();
    }
  }, [visible, permission, requestPermission]);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    onScanned(data); // Pass the ID back to parent
    onClose();
  };

  if (!visible) return null;

  if (!permission?.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.center}>
          <Text style={{marginBottom: 20}}>Camera permission is required</Text>
          <TouchableOpacity onPress={requestPermission} style={styles.btn}><Text style={styles.btnTxt}>Grant Permission</Text></TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={[styles.btn, {marginTop:10}]}><Text style={styles.btnTxt}>Close</Text></TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={{ flex: 1, backgroundColor: 'black' }}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
        />
        
        {/* Overlay */}
        <SafeAreaView style={styles.overlay}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.title}>Scan Opponent QR</Text>
          </View>
          <View style={styles.frame} />
          <Text style={styles.hint}>Align QR code within the frame</Text>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlay: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 50 },
  header: { width: '100%', paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' },
  closeBtn: { padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 },
  title: { color: 'white', fontSize: 18, fontWeight: 'bold', marginLeft: 20 },
  frame: { width: 250, height: 250, borderWidth: 2, borderColor: COLORS.primary, borderRadius: 20 },
  hint: { color: 'white', backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 8 },
  btn: { padding: 15, backgroundColor: COLORS.primary, borderRadius: 10 },
  btnTxt: { color: 'white', fontWeight: 'bold' }
});

export default ScannerModal;
