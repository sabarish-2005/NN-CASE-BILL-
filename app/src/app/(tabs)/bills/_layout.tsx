import { Stack } from 'expo-router';

export default function BillsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Bills' }} />
      <Stack.Screen name="new" options={{ title: 'New Bill', presentation: 'modal' }} />
      <Stack.Screen name="[id]" options={{ title: 'Bill Details' }} />
    </Stack>
  );
}
