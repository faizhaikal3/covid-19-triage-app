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
import { useLocalSearchParams, router } from 'expo-router';
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

export default function AssessmentScreen() {
  const insets = useSafeAreaInsets();
  const { userId, userName } = useLocalSearchParams();

  const [temperature, setTemperature] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [triageResult, setTriageResult] = useState<any>(null);
  
  const [quarantineActive, setQuarantineActive] = useState(false);
  const [quarantineDaysLeft, setQuarantineDaysLeft] = useState(5);

  const toggleSymptom = (id: string) => {
    if (selectedSymptoms.includes(id)) {
      setSelectedSymptoms(selectedSymptoms.filter(item => item !== id));
    } else {
      setSelectedSymptoms([...selectedSymptoms, id]);
    }
  };

  const handleSymptomSubmit = async () => {
    if (!temperature) {
      Alert.alert('Validation Error', 'Please enter your current body temperature.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/symptoms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: userId, 
          temperature: parseFloat(temperature), 
          symptoms: selectedSymptoms 
        }),
      });
      const data = await response.json();
      
      if (response.ok) {
        setTriageResult(data);
        if (data.category.includes('Category 2')) {
          setQuarantineActive(true);
          setQuarantineDaysLeft(5);
        }
      } else {
        Alert.alert('Submission Error', data.error || 'Failed to process assessment.');
      }
    } catch (error) {
      Alert.alert('Connection Error', 'Unable to reach clinical server.');
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
          { paddingTop: Math.max(insets.top, 24), paddingBottom: 110 }
        ]}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.brandTitle}>COVID-19 Triage</Text>
          <Text style={styles.brandSubtitle}>Clinical Assessment Dashboard</Text>
        </View>
        
        <View style={styles.card}>
          <View style={styles.userBanner}>
            <Text style={styles.userBannerText}>Signed in as {userName || 'Patient'}</Text>
          </View>

          {quarantineActive && (
            <View style={styles.quarantineBanner}>
              <Text style={styles.quarantineTitle}>Active Home Isolation</Text>
              <Text style={styles.quarantineDays}>{quarantineDaysLeft} Days Remaining</Text>
              <Text style={styles.quarantineSub}>Monitor temperature and SpO2 twice daily.</Text>
            </View>
          )}

          {!triageResult ? (
            <>
              <Text style={styles.sectionHeader}>Health Assessment Questionnaire</Text>
              
              <Text style={styles.inputLabel}>Body Temperature (°C)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 37.5"
                placeholderTextColor="#b0b0b0"
                value={temperature}
                onChangeText={setTemperature}
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Select Applicable Symptoms:</Text>
              <View style={styles.symptomsGrid}>
                {SYMPTOM_OPTIONS.map((item) => {
                  const isSelected = selectedSymptoms.includes(item.id);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.symptomChip, isSelected && styles.symptomChipSelected]}
                      onPress={() => toggleSymptom(item.id)}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              
              <TouchableOpacity style={styles.primaryButton} onPress={handleSymptomSubmit}>
                <Text style={styles.primaryButtonText}>Submit Assessment</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.resultContainer}>
              <Text style={styles.cardTitle}>Triage Evaluation Report</Text>
              
              <View style={[
                styles.badge, 
                triageResult.severity === 'danger' ? styles.badgeDanger : 
                triageResult.severity === 'warning' ? styles.badgeWarning : styles.badgeSafe
              ]}>
                <Text style={styles.badgeText}>{triageResult.category}</Text>
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Clinical Evaluation</Text>
                <Text style={styles.adviceText}>{triageResult.advice}</Text>
                
                <Text style={styles.infoLabel}>Required Action Protocol</Text>
                <Text style={styles.actionText}>{triageResult.action}</Text>
              </View>
              
              <TouchableOpacity style={styles.primaryButton} onPress={() => { setTriageResult(null); setSelectedSymptoms([]); setTemperature(''); }}>
                <Text style={styles.primaryButtonText}>Perform New Assessment</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.replace('/')}>
            <Text style={styles.secondaryButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 },
  headerContainer: { marginBottom: 24, alignItems: 'center' },
  brandTitle: { fontSize: 24, fontWeight: '800', color: '#FF385C', letterSpacing: -0.5, textAlign: 'center' },
  brandSubtitle: { fontSize: 12, color: '#717171', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: '600' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#E0E0E0', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#222222', marginBottom: 20 },
  sectionHeader: { fontSize: 16, fontWeight: '700', color: '#222222', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E0E0E0', paddingBottom: 10 },
  userBanner: { backgroundColor: '#F7F7F7', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#E0E0E0' },
  userBannerText: { fontSize: 13, color: '#222222', fontWeight: '600' },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#717171', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#B0B0B0', borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 16, color: '#222222' },
  symptomsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  symptomChip: { backgroundColor: '#F7F7F7', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 20, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 6 },
  symptomChipSelected: { backgroundColor: '#FF385C', borderColor: '#FF385C' },
  chipText: { fontSize: 13, color: '#717171', fontWeight: '500' },
  chipTextSelected: { color: '#FFFFFF', fontWeight: '700' },
  primaryButton: { backgroundColor: '#FF385C', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  secondaryButton: { backgroundColor: '#F7F7F7', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 20, borderWidth: 1, borderColor: '#E0E0E0' },
  secondaryButtonText: { color: '#717171', fontSize: 14, fontWeight: '600' },
  resultContainer: { alignItems: 'stretch', width: '100%' },
  badge: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, marginBottom: 20, alignItems: 'center' },
  badgeSafe: { backgroundColor: '#008489' },
  badgeWarning: { backgroundColor: '#FC642D' },
  badgeDanger: { backgroundColor: '#FF385C' },
  badgeText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16, textAlign: 'center' },
  infoBox: { backgroundColor: '#F7F7F7', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, padding: 16, marginBottom: 20 },
  infoLabel: { fontSize: 11, fontWeight: '700', color: '#717171', textTransform: 'uppercase', marginBottom: 4, marginTop: 10, letterSpacing: 0.8 },
  adviceText: { fontSize: 14, color: '#222222', lineHeight: 22 },
  actionText: { fontSize: 14, color: '#222222', fontWeight: '700', lineHeight: 22 },
  quarantineBanner: { backgroundColor: '#FFF8F8', borderWidth: 1, borderColor: '#FFD7D9', borderRadius: 12, padding: 16, marginBottom: 20 },
  quarantineTitle: { color: '#FF385C', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4, letterSpacing: 0.8 },
  quarantineDays: { color: '#222222', fontSize: 18, fontWeight: '800', marginBottom: 2 },
  quarantineSub: { color: '#717171', fontSize: 13 },
});