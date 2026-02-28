import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { ChallengeOverlay } from '@/components/challenge-overlay';
import { configureAlarmKit } from '@/services/alarm-kit';
import { AppModeProvider } from '@/contexts/app-mode';
import { AuthProvider } from '@/contexts/auth';
import { ChallengeProvider } from '@/contexts/challenge';
import { KidsProvider } from '@/contexts/kids';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    configureAlarmKit();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AppModeProvider>
      <AuthProvider>
        <KidsProvider>
        <ChallengeProvider>
          <Stack initialRouteName="index">
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="child-mode" options={{ headerShown: false, gestureEnabled: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <ChallengeOverlay />
          <StatusBar style="auto" />
        </ChallengeProvider>
        </KidsProvider>
      </AuthProvider>
      </AppModeProvider>
    </ThemeProvider>
  );
}
