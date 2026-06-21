import { Stack } from 'expo-router';

export default function ProductsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Products' }} />
      <Stack.Screen name="new" options={{ title: 'Product Details', presentation: 'modal' }} />
    </Stack>
  );
}
