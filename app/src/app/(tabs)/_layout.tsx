import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Home, FileText, Users, Box, Hammer, Settings } from 'lucide-react-native';
import { SyncBadge } from '../../components/ui/SyncBadge';
import { TouchableOpacity } from 'react-native';

export default function TabLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#0A2E1A',
        tabBarInactiveTintColor: '#64748B',
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTitleStyle: {
          color: '#1E293B',
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/settings')} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <SyncBadge />
              <Settings size={24} color="#1E293B" style={{ marginRight: 16 }} />
            </TouchableOpacity>
          )
        }}
      />
      <Tabs.Screen
        name="bills"
        options={{
          title: 'Bills',
          headerShown: false, // Let the stack inside handle headers
          tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: 'Customers',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Products',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Box color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="labors"
        options={{
          title: 'Labors',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Hammer color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
