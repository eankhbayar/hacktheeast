import { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Text,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { AlarmPermissionModal } from '@/components/alarm-permission-modal';
import { useAppMode } from '@/contexts/app-mode';
import { useKids } from '@/contexts/kids';
import { useAuth } from '@/hooks/use-auth';
import { useChallenge } from '@/hooks/use-challenge';
import { BlipRobot } from '@/images';

const STORAGE_KEY_ALARM_PERMISSION_ASKED = 'alarm_permission_asked';

const YELLOW = '#FFD600';
const DARK = '#2E2E00';
const DARK_OLIVE = '#3D3B00';
const WHITE = '#FFFFFF';
const ACCENT_RED = '#D32F2F';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const { enterChildMode } = useAppMode();
  const { kids } = useKids();
  const {
    minutesUntilNext,
    setIntervalMinutes,
    triggerChallenge,
  } = useChallenge();
  const [, setTick] = useState(0);
  const [showAlarmPermission, setShowAlarmPermission] = useState(false);

  const activeKids = useMemo(() => kids.filter((k) => k.active), [kids]);
  const firstActiveInterval = activeKids[0]?.intervalMinutes;

  useEffect(() => {
    if (firstActiveInterval != null) setIntervalMinutes(firstActiveInterval);
  }, [firstActiveInterval, setIntervalMinutes]);

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

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const handleChildMode = async () => {
    const kid = activeKids[0];
    if (!kid) return;
    enterChildMode(kid);
    router.replace('/child-mode');
    logout();
  };

  const firstName = user?.fullName?.split(' ')[0] ?? '';

  return (
    <>
      <AlarmPermissionModal
        visible={showAlarmPermission}
        onDismiss={handleAlarmPermissionDismiss}
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.userName}>{firstName || 'Parent'}</Text>
            </View>
            <TouchableOpacity style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {firstName ? firstName[0].toUpperCase() : 'P'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Mascot */}
          <View style={styles.mascotWrapper}>
            <Image source={BlipRobot} style={styles.mascotImage} resizeMode="contain" />
          </View>

          {/* Active Kids */}
          {activeKids.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No active kids. Enable kids in the Kids tab.</Text>
            </View>
          )}

          {activeKids.map((kid) => (
            <View key={kid.id} style={styles.timerCard}>
              <View style={[styles.kidDot, { backgroundColor: kid.avatarColor }]}>
                <Text style={styles.kidDotEmoji}>{kid.avatarEmoji}</Text>
              </View>
              <View style={styles.timerContent}>
                <Text style={styles.activeKidName}>{kid.name}</Text>
                <Text style={styles.timerLabel}>Next Challenge In</Text>
                <Text style={styles.timerValue}>
                  {minutesUntilNext !== null ? `${minutesUntilNext} min` : '—'}
                </Text>
              </View>
              <View style={styles.intervalBadge}>
                <Text style={styles.intervalBadgeText}>
                  Every {kid.intervalMinutes} min
                </Text>
              </View>
            </View>
          ))}

          {/* Test Challenge Button */}
          {/* <TouchableOpacity
            style={styles.testBtn}
            onPress={triggerChallenge}
            activeOpacity={0.8}
          >
            <Text style={styles.testBtnText}>Test Challenge Now</Text>
          </TouchableOpacity> */}

          {/* Child Mode Button */}
          <TouchableOpacity
            style={[styles.childModeBtn, activeKids.length === 0 && styles.childModeBtnDisabled]}
            onPress={handleChildMode}
            activeOpacity={0.8}
            disabled={activeKids.length === 0}
          >
            <Text style={styles.childModeBtnText}>Child Mode</Text>
          </TouchableOpacity>

          {/* Sign Out */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: YELLOW,
  },
  scrollView: {
    flex: 1,
    backgroundColor: YELLOW,
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 16,
    color: DARK_OLIVE,
    fontWeight: '500',
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    color: DARK,
    marginTop: 2,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: DARK_OLIVE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: YELLOW,
    fontSize: 20,
    fontWeight: '700',
  },

  // Mascot
  mascotWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  mascotImage: {
    width: 180,
    height: 180,
  },

  // Empty state
  emptyCard: {
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },

  // Timer Card
  timerCard: {
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  kidDot: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  kidDotEmoji: {
    fontSize: 26,
  },
  timerContent: {
    flex: 1,
  },
  activeKidName: {
    fontSize: 17,
    fontWeight: '800',
    color: DARK,
  },
  timerLabel: {
    fontSize: 11,
    color: DARK_OLIVE,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  timerValue: {
    fontSize: 26,
    fontWeight: '800',
    color: DARK,
  },
  intervalBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  intervalBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: DARK_OLIVE,
  },

  // Test Button
  testBtn: {
    backgroundColor: DARK_OLIVE,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  testBtnText: {
    color: YELLOW,
    fontSize: 16,
    fontWeight: '700',
  },

  // Child Mode Button
  childModeBtn: {
    backgroundColor: '#FF9800',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  childModeBtnDisabled: {
    opacity: 0.4,
  },
  childModeBtnText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '700',
  },

  // Logout
  logoutBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: ACCENT_RED,
  },
});
