import { Stack } from 'expo-router';
import { useRole } from '../../hooks/useRole';
import { View, Text } from 'react-native';

export default function AdminLayout() {
  const { isAdmin } = useRole();

  if (!isAdmin) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Access Denied. Admins only.</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: 'Admin Panel' }} />
    </Stack>
  );
}
