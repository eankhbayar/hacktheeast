import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { ChallengeOverlay } from '@/components/challenge-overlay';
import { configureAlarmKit } from '@/services/alarm-kit';
import { AuthProvider } from '@/contexts/auth';
import { ChallengeProvider } from '@/contexts/challenge';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    configureAlarmKit();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <ChallengeProvider>
          <Stack initialRouteName="index">
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <ChallengeOverlay />
          <StatusBar style="auto" />
        </ChallengeProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
