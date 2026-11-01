import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  Alert 
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const API_URL = 'http://192.168.0.182:5000';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [isLogin, setIsLogin] = useState(true);
  
  const [fullName, setFullName] = useState('');
  const [icOrPassport, setIcOrPassport] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');

  const handleAuth = async () => {
    const endpoint = isLogin ? '/api/login' : '/api/register';
    let payload = isLogin 
      ? { ic_or_passport: icOrPassport, password }
      : { full_name: fullName, ic_or_passport: icOrPassport, phone_number: phoneNumber, password };

    if (!icOrPassport || !password || (!isLogin && (!fullName || !phoneNumber))) {
      Alert.alert('Validation Error', 'Please complete all required fields.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      
      if (response.ok) {
        if (isLogin) {
          await AsyncStorage.setItem('userId', String(data.user_id));
          await AsyncStorage.setItem('userName', data.full_name);

          router.replace({
            pathname: '/(tabs)/assessment',
            params: { userId: String(data.user_id), userName: data.full_name }
          });
        } else {
          Alert.alert('Registration Successful', 'Please sign in with your credentials.');
          setIsLogin(true);
        }
      } else {
        Alert.alert('Authentication Error', data.error || 'Operation failed.');
      }
    } catch (error) {
      Alert.alert('Connection Error', `Unable to connect to server at ${API_URL}`);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContainer, 
          { paddingTop: Math.max(insets.top, 24), paddingBottom: Math.max(insets.bottom, 24) }
        ]}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.brandTitle}>COVID-19 Triage</Text>
          <Text style={styles.brandSubtitle}>Clinical Assessment Platform</Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
          
          {!isLogin && (
            <>
              <Text style={styles.inputLabel}>Full Legal Name</Text>
              <TextInput style={styles.input} placeholder="Enter full name" placeholderTextColor="#b0b0b0" value={fullName} onChangeText={setFullName} />
              
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput style={styles.input} placeholder="Enter phone number" placeholderTextColor="#b0b0b0" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
            </>
          )}

          <Text style={styles.inputLabel}>IC Number or Passport</Text>
          <TextInput style={styles.input} placeholder="Enter identification number" placeholderTextColor="#b0b0b0" value={icOrPassport} onChangeText={setIcOrPassport} autoCapitalize="none" />
          
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput style={styles.input} placeholder="Enter password" placeholderTextColor="#b0b0b0" value={password} onChangeText={setPassword} secureTextEntry />
          
          <TouchableOpacity style={styles.primaryButton} onPress={handleAuth}>
            <Text style={styles.primaryButtonText}>{isLogin ? 'Sign In' : 'Agree and Continue'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.switchButton} onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.switchButtonText}>
              {isLogin ? "Don't have an account? Register" : 'Already have an account? Sign In'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 },
  headerContainer: { marginBottom: 32, alignItems: 'center' },
  brandTitle: { fontSize: 26, fontWeight: '800', color: '#FF385C', letterSpacing: -0.5, textAlign: 'center' },
  brandSubtitle: { fontSize: 12, color: '#717171', marginTop: 6, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: '600' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#E0E0E0', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#222222', marginBottom: 20 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#717171', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#B0B0B0', borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 16, color: '#222222' },
  primaryButton: { backgroundColor: '#FF385C', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  switchButton: { marginTop: 20, alignItems: 'center' },
  switchButtonText: { color: '#222222', fontSize: 14, fontWeight: '600' },
});