import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Linking 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const API_URL = 'http://192.168.0.182:5000';

export default function ClinicsScreen() {
  const insets = useSafeAreaInsets();
  const [clinicsList, setClinicsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    try {
      const response = await fetch(`${API_URL}/api/clinics`);
      const data = await response.json();
      if (response.ok) {
        setClinicsList(data);
      } else {
        Alert.alert('Error', 'Failed to retrieve clinic directory.');
      }
    } catch (error) {
      Alert.alert('Connection Error', 'Unable to reach clinical server.');
    } finally {
      setLoading(false);
    }
  };

  const handleCallClinic = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
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
        <Text style={styles.brandSubtitle}>Kuala Lumpur Healthcare Directory</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Authorized Clinics & Assessment Centres</Text>
        
        {loading ? (
          <Text style={styles.emptyText}>Loading clinic directory...</Text>
        ) : clinicsList.length === 0 ? (
          <Text style={styles.emptyText}>No clinic records found.</Text>
        ) : (
          clinicsList.map((clinic, index) => (
            <View key={index} style={styles.clinicCard}>
              <Text style={styles.clinicName}>{clinic.name}</Text>
              <Text style={styles.clinicType}>{clinic.type}</Text>
              <Text style={styles.clinicAddress}>Address: {clinic.address}</Text>
              <Text style={styles.clinicHours}>Hours: {clinic.operating_hours}</Text>
              
              <TouchableOpacity style={styles.callButton} onPress={() => handleCallClinic(clinic.contact)}>
                <Text style={styles.callButtonText}>Call Clinic: {clinic.contact}</Text>
              </TouchableOpacity>
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
  clinicCard: { backgroundColor: '#F7F7F7', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, padding: 16, marginBottom: 16 },
  clinicName: { color: '#222222', fontWeight: '700', fontSize: 16, marginBottom: 4 },
  clinicType: { color: '#FF385C', fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  clinicAddress: { color: '#717171', fontSize: 13, marginBottom: 4, lineHeight: 18 },
  clinicHours: { color: '#717171', fontSize: 12, marginBottom: 14 },
  callButton: { backgroundColor: '#008489', borderRadius: 8, padding: 12, alignItems: 'center' },
  callButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});