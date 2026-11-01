import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  Alert 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const API_URL = 'http://192.168.0.182:5000';

const SYMPTOM_OPTIONS = [
  { id: 'fever', label: 'Fever (Above 37.5°C)' },
  { id: 'persistent_fever', label: 'High Persistent Fever (Above 38.5°C)' },
  { id: 'cough', label: 'Cough or Cold' },
  { id: 'sore_throat', label: 'Sore Throat' },
  { id: 'fatigue', label: 'Severe Fatigue or Body Aches' },
  { id: 'loss_taste_smell', label: 'Loss of Taste or Smell' },
  { id: 'breathing_difficulty_exertion', label: 'Breathlessness on Exertion' },
  { id: 'severe_breathing_difficulty', label: 'Severe Shortness of Breath' },
  { id: 'chest_pain', label: 'Chest Pain or Tightness' },
  { id: 'confusion', label: 'Confusion or Disorientation' },
  { id: 'blue_lips', label: 'Bluish Lips or Face' },
];

const formatSymptomsDisplay = (rawSymptoms: string) => {
  try {
    let cleaned = rawSymptoms.replace(/[\[\]']/g, '').split(',');
    let labels = cleaned.map(item => {
      let trimmed = item.trim();
      let found = SYMPTOM_OPTIONS.find(opt => opt.id === trimmed);
      return found ? found.label : trimmed;
    }).filter(Boolean);

    return labels.length > 0 ? labels.join(', ') : 'No symptoms reported';
  } catch (e) {
    return rawSymptoms;
  }
};

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      loadHistory();
    }, [])
  );

  const loadHistory = async () => {
    try {
      setLoading(true);
      const storedUserId = await AsyncStorage.getItem('userId');
      if (!storedUserId) {
        Alert.alert('Session Error', 'Please sign in again.');
        return;
      }

      const response = await fetch(`${API_URL}/api/symptoms/history/${storedUserId}`);
      const data = await response.json();
      if (response.ok) {
        setHistoryLogs(data);
      } else {
        Alert.alert('Error', 'Failed to retrieve assessment history.');
      }
    } catch (error) {
      Alert.alert('Connection Error', 'Unable to reach clinical server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      contentContainerStyle={[
        styles.scrollContainer, 
        { paddingTop: Math.max(insets.top, 24), paddingBottom: 110 }
      ]}
    >
      <View style={styles.headerContainer}>
        <Text style={styles.brandTitle}>COVID-19 Triage</Text>
        <Text style={styles.brandSubtitle}>Patient Assessment History</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Past Assessment Logs</Text>
        
        {loading ? (
          <Text style={styles.emptyText}>Loading records...</Text>
        ) : historyLogs.length === 0 ? (
          <Text style={styles.emptyText}>No previous assessment records found.</Text>
        ) : (
          historyLogs.map((log, index) => (
            <View key={index} style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyTemp}>Temperature: {log.temperature}°C</Text>
                <Text style={styles.historyDate}>{log.submitted_at}</Text>
              </View>
              <Text style={styles.historyLabel}>Reported Symptoms</Text>
              <Text style={styles.historySymptoms}>{formatSymptomsDisplay(log.symptoms)}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, backgroundColor: '#F7F7F7' },
  headerContainer: { marginBottom: 24, alignItems: 'center' },
  brandTitle: { fontSize: 24, fontWeight: '800', color: '#FF385C', letterSpacing: -0.5, textAlign: 'center' },
  brandSubtitle: { fontSize: 12, color: '#717171', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: '600' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#E0E0E0', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#222222', marginBottom: 20 },
  emptyText: { color: '#717171', textAlign: 'center', marginVertical: 24, fontSize: 14 },
  historyCard: { backgroundColor: '#F7F7F7', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, padding: 16, marginBottom: 14 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  historyTemp: { color: '#222222', fontWeight: '700', fontSize: 14 },
  historyDate: { color: '#717171', fontSize: 12 },
  historyLabel: { color: '#717171', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginTop: 6, letterSpacing: 0.8 },
  historySymptoms: { color: '#222222', fontSize: 14, marginTop: 4, lineHeight: 20 },
});