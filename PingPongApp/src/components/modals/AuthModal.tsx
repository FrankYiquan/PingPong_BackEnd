import React, { useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator, // <--- Import this
  Alert              // <--- Import this for native alerts
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext'; 

interface Props {
  visible: boolean;
  onClose: () => void;
  onLoginSuccess?: (token: string) => void;
}

const AuthModal: React.FC<Props> = ({ visible, onClose, onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const { login, register } = useAuth();

  const handleSubmit = async () => {
  if (!email || !password || (!isLogin && !username)) {
    Alert.alert("Missing Fields", "Please fill in all fields.");
    return;
  }

  setSubmitting(true);
  try {
    let token: string;

    if (isLogin) {
      token = await login(email, password);
    } else {
      token = await register(username, email, password);
    }

    console.log("Auth successful");

    if (onLoginSuccess) onLoginSuccess(token);
    onClose();

    setEmail('');
    setPassword('');
    setUsername('');
    
  } catch (err: any) {
    console.log("Auth error:", err.message);
  } finally {
    console.log("Setting submitting to false");
    setSubmitting(false);
  }
};


  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <View style={styles.card}>
              {/* Header */}
              <View style={styles.header}>
                <View>
                  <Text style={styles.title}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
                  <Text style={styles.sub}>{isLogin ? 'Enter your details to sign in' : 'Join the arena today'}</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Feather name="x" size={24} color={COLORS.textSec} />
                </TouchableOpacity>
              </View>

              {/* Form Fields */}
              <View style={styles.form}>
                {!isLogin && (
                  <View style={styles.inputContainer}>
                    <Feather name="user" size={20} color={COLORS.textSec} style={styles.icon} />
                    <TextInput 
                      style={styles.input} 
                      placeholder="Username" 
                      placeholderTextColor={COLORS.textSec}
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none" // Important for usernames
                    />
                  </View>
                )}

                <View style={styles.inputContainer}>
                  <Feather name="mail" size={20} color={COLORS.textSec} style={styles.icon} />
                  <TextInput 
                    style={styles.input} 
                    placeholder="Email Address" 
                    placeholderTextColor={COLORS.textSec}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Feather name="lock" size={20} color={COLORS.textSec} style={styles.icon} />
                  <TextInput 
                    style={styles.input} 
                    placeholder="Password" 
                    placeholderTextColor={COLORS.textSec}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>
              </View>

              {/* 3. Submit Button with Loading State */}
              <TouchableOpacity 
                style={[styles.submitBtn, submitting && { opacity: 0.8 }]} 
                onPress={handleSubmit}
                disabled={submitting}
              >
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primaryDark]}
                  style={styles.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {submitting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Text style={styles.submitText}>{isLogin ? 'LOG IN' : 'SIGN UP'}</Text>
                      <Feather name="arrow-right" size={20} color="white" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Toggle Mode */}
              <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.footer}>
                <Text style={styles.footerText}>
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <Text style={styles.linkText}>{isLogin ? 'Sign Up' : 'Log In'}</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center' },
  keyboardView: { width: '100%', alignItems: 'center' },
  card: { width: '85%', backgroundColor: 'white', borderRadius: 24, padding: 30, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 15, elevation: 10 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30 },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.text, marginBottom: 5 },
  sub: { fontSize: 14, color: COLORS.textSec, fontWeight: '500' },
  closeBtn: { padding: 5, marginTop: -5, marginRight: -5 },

  form: { gap: 16, marginBottom: 30 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bg, borderRadius: 16, paddingHorizontal: 16, height: 56, borderWidth: 1, borderColor: COLORS.border },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: COLORS.text, fontWeight: '600' },

  submitBtn: { shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  gradient: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 18, borderRadius: 16, gap: 8 },
  submitText: { color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 1 },

  footer: { marginTop: 20, alignItems: 'center' },
  footerText: { color: COLORS.textSec, fontSize: 14 },
  linkText: { color: COLORS.primary, fontWeight: 'bold' }
});

export default AuthModal;
