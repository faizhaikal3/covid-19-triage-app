import { Tabs, useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';

export default function TabLayout() {
  const params = useLocalSearchParams();

  return (
    <Tabs 
      screenOptions={{ 
        headerShown: false,
        tabBarActiveTintColor: '#FF385C',
        tabBarInactiveTintColor: '#717171',
        tabBarStyle: {
          position: 'absolute',
          bottom: 24,
          left: 64,
          right: 64,
          backgroundColor: '#FFFFFF',
          borderRadius: 32,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: '#E0E0E0',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        }
      }}
    >
      <Tabs.Screen 
        name="assessment" 
        options={{ 
          title: 'Assessment',
          tabBarIcon: () => <Text style={{ fontSize: 16 }}>📋</Text>
        }} 
        initialParams={params}
      />
      <Tabs.Screen 
        name="history" 
        options={{ 
          title: 'History',
          tabBarIcon: () => <Text style={{ fontSize: 16 }}>📜</Text>
        }} 
        initialParams={params}
      />
      <Tabs.Screen 
        name="clinics" 
        options={{ 
          title: 'Clinics',
          tabBarIcon: () => <Text style={{ fontSize: 16 }}>🏥</Text>
        }} 
        initialParams={params}
      />
    </Tabs>
  );
}