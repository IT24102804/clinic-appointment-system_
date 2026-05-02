import { AuthProvider } from '../context/AuthContext';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: 'index',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(patient)" options={{ headerShown: false }} />
          <Stack.Screen name="(doctor)" options={{ headerShown: false }} />
          <Stack.Screen name="(admin)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="account/profile" options={{ headerShown: false }} />
          <Stack.Screen name="prescriptions/new" options={{ headerShown: false }} />
          <Stack.Screen name="prescriptions/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="prescriptions/[id]/edit" options={{ headerShown: false }} />
          <Stack.Screen name="placeholders/patients" options={{ headerShown: false }} />
          <Stack.Screen name="placeholders/doctors" options={{ headerShown: false }} />
          <Stack.Screen name="placeholders/billing" options={{ headerShown: false }} />
          <Stack.Screen name="placeholders/medical-records" options={{ headerShown: false }} />
          {/* Add auth screens */}
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="dark" />
      </ThemeProvider>
    </AuthProvider>
  );
}