import { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/hooks/use-auth';

export default function TabLayout() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/(auth)/login');
    }
  }, [user, isLoading, router]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2E2E00',
        tabBarInactiveTintColor: '#9E9E00',
        tabBarStyle: {
          backgroundColor: '#FFD600',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="gearshape.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
