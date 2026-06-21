import { Stack } from 'expo-router';

export default function LaborsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Labors' }} />
      <Stack.Screen name="new" options={{ title: 'Labor Details', presentation: 'modal' }} />
      <Stack.Screen name="[id]" options={{ title: 'Labor Detail & Work Entry' }} />
    </Stack>
  );
}
