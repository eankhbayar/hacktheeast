import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Button,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { AlarmPermissionModal } from '@/components/alarm-permission-modal';
import { useAuth } from '@/hooks/use-auth';
import { useChallenge } from '@/hooks/use-challenge';
import { useThemeColor } from '@/hooks/use-theme-color';

const INTERVAL_OPTIONS = [15, 30, 45, 60];
const STORAGE_KEY_ALARM_PERMISSION_ASKED = 'alarm_permission_asked';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const {
    minutesUntilNext,
    intervalMinutes,
    setIntervalMinutes,
    triggerChallenge,
  } = useChallenge();
  const [content, setContent] = useState('');
  const [, setTick] = useState(0);
  const [showAlarmPermission, setShowAlarmPermission] = useState(false);
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!user) return;
    AsyncStorage.getItem(STORAGE_KEY_ALARM_PERMISSION_ASKED).then((v) => {
      if (v !== 'true') {
        setShowAlarmPermission(true);
      }
    });
  }, [user]);

  const handleAlarmPermissionDismiss = () => {
    setShowAlarmPermission(false);
    AsyncStorage.setItem(STORAGE_KEY_ALARM_PERMISSION_ASKED, 'true');
  };

  const handleGenerate = async () => {
    // TODO: Call API
    console.log('Generate content');
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <>
      <AlarmPermissionModal
        visible={showAlarmPermission}
        onDismiss={handleAlarmPermissionDismiss}
      />
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <ThemedText type="title" style={styles.title}>
        Welcome{user ? `, ${user.fullName}` : ''}
      </ThemedText>

      <View style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Next challenge
        </ThemedText>
        <ThemedText style={styles.countdown}>
          {minutesUntilNext !== null ? `${minutesUntilNext} min` : '—'}
        </ThemedText>
      </View>

      <View style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Challenge interval
        </ThemedText>
        <View style={styles.intervalRow}>
          {INTERVAL_OPTIONS.map((m) => (
            <TouchableOpacity
              key={m}
              style={[
                styles.intervalBtn,
                intervalMinutes === m && { backgroundColor: tintColor },
              ]}
              onPress={() => setIntervalMinutes(m)}
            >
              <ThemedText
                lightColor={intervalMinutes === m ? '#fff' : undefined}
                darkColor={intervalMinutes === m ? '#fff' : undefined}
              >
                {m} min
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.testBtn, { backgroundColor: '#dc2626' }]}
        onPress={triggerChallenge}
      >
        <ThemedText lightColor="#fff" darkColor="#fff" style={styles.testBtnText}>
          Test Challenge (check if escapable)
        </ThemedText>
      </TouchableOpacity>

      <Button title="Generate Content" onPress={handleGenerate} />
      {content && <ThemedText style={styles.content}>{content}</ThemedText>}
      <TouchableOpacity style={styles.logout} onPress={handleLogout}>
        <ThemedText type="link">Sign Out</ThemedText>
      </TouchableOpacity>
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
    alignItems: 'center',
  },
  sectionTitle: {
    marginBottom: 8,
  },
  countdown: {
    fontSize: 20,
  },
  intervalRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  intervalBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#64748b',
  },
  testBtn: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  testBtnText: {
    fontWeight: '600',
    fontSize: 16,
  },
  content: {
    marginTop: 20,
    textAlign: 'center',
  },
  logout: {
    marginTop: 24,
  },
});