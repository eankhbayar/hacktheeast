import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAppMode } from '@/contexts/app-mode';
import { useChallenge } from '@/hooks/use-challenge';
import { BlipRobot } from '@/images';

const YELLOW = '#FFD600';
const DARK = '#2E2E00';
const DARK_OLIVE = '#3D3B00';
const WHITE = '#FFFFFF';
const ACCENT_RED = '#D32F2F';

export default function ChildModeScreen() {
  const { childModeKid, exitChildMode } = useAppMode();
  const {
    isChallengeActive,
    nextChallengeAt,
    setIntervalMinutes,
    scheduleTestChallenge,
  } = useChallenge();
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (childModeKid) {
      setIntervalMinutes(childModeKid.intervalMinutes);
    }
  }, [childModeKid, setIntervalMinutes]);

  useEffect(() => {
    const tick = () => {
      if (nextChallengeAt && !isChallengeActive) {
        setSecondsLeft(Math.max(0, Math.ceil((nextChallengeAt - Date.now()) / 1000)));
      } else {
        setSecondsLeft(null);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextChallengeAt, isChallengeActive]);

  const handleTestTimer = async () => {
    await scheduleTestChallenge(10);
  };

  const handleExit = () => {
    exitChildMode();
    router.replace('/(auth)/login');
  };

  if (!childModeKid) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.noKidText}>No kid selected.</Text>
          <TouchableOpacity style={styles.exitBtn} onPress={handleExit} activeOpacity={0.8}>
            <Text style={styles.exitBtnText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <Image source={BlipRobot} style={styles.mascot} resizeMode="contain" />

        <View style={[styles.kidBadge, { backgroundColor: childModeKid.avatarColor }]}>
          <Text style={styles.kidEmoji}>{childModeKid.avatarEmoji}</Text>
        </View>
        <Text style={styles.kidName}>{childModeKid.name}</Text>

        <View style={styles.modeTag}>
          <Text style={styles.modeTagText}>Child Mode Active</Text>
        </View>

        {/* Timer display */}
        <View style={styles.timerCard}>
          <Text style={styles.timerLabel}>Next Challenge In</Text>
          <Text style={styles.timerValue}>
            {secondsLeft !== null
              ? secondsLeft < 60
                ? `${secondsLeft}s`
                : `${Math.ceil(secondsLeft / 60)} min`
              : '—'}
          </Text>
          <View style={styles.intervalBadge}>
            <Text style={styles.intervalBadgeText}>
              Every {childModeKid.intervalMinutes} min
            </Text>
          </View>
        </View>

        {/* 10s test timer */}
        {/* <TouchableOpacity
          style={styles.testBtn}
          onPress={handleTestTimer}
          activeOpacity={0.8}
          disabled={secondsLeft !== null && secondsLeft <= 10}
        >
          <Text style={styles.testBtnText}>
            {secondsLeft !== null && secondsLeft <= 10
              ? `Challenge in ${secondsLeft}s...`
              : 'Test 10s Timer'}
          </Text>
        </TouchableOpacity> */}

        <View style={styles.spacer} />

        {/* Exit to login */}
        <TouchableOpacity style={styles.exitBtn} onPress={handleExit} activeOpacity={0.7}>
          <Text style={styles.exitBtnText}>Exit to Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: YELLOW,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  noKidText: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
    marginBottom: 24,
  },

  mascot: {
    width: 160,
    height: 160,
    marginBottom: 16,
  },
  kidBadge: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  kidEmoji: {
    fontSize: 36,
  },
  kidName: {
    fontSize: 28,
    fontWeight: '800',
    color: DARK,
    marginBottom: 8,
  },

  modeTag: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 14,
    marginBottom: 28,
  },
  modeTagText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  timerCard: {
    backgroundColor: WHITE,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  timerLabel: {
    fontSize: 13,
    color: DARK_OLIVE,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  timerValue: {
    fontSize: 42,
    fontWeight: '800',
    color: DARK,
    marginBottom: 12,
  },
  intervalBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  intervalBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: DARK_OLIVE,
  },

  testBtn: {
    backgroundColor: DARK_OLIVE,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
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

  spacer: {
    flex: 1,
  },

  exitBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 16,
  },
  exitBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: ACCENT_RED,
  },
});
