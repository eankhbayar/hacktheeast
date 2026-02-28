import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  BackHandler,
  Platform,
  KeyboardAvoidingView,
  Vibration,
  StatusBar,
  Text,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useChallenge } from '@/hooks/use-challenge';
import { useAuth } from '@/hooks/use-auth';
import { getRandomQuestion } from '@/lib/questions';
import { BlipHead } from '@/images';

const ALARM_VIBRATION_PATTERN = [0, 800, 400, 800, 400, 800, 400, 800];
const HAPTIC_INTERVAL_MS = 1200;

const YELLOW = '#FFD600';
const DARK = '#2E2E00';
const DARK_OLIVE = '#3D3B00';
const WHITE = '#FFFFFF';

export function ChallengeOverlay() {
  const { isChallengeActive, dismissChallenge } = useChallenge();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [question, setQuestion] = useState<{ question: string; answer: string } | null>(null);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const shakeX = useSharedValue(0);
  const bgFlash = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(bgFlash.value, [0, 1], [YELLOW, '#D32F2F']),
  }));

  const shake = () => {
    shakeX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  const flashRed = () => {
    bgFlash.value = withSequence(
      withTiming(1, { duration: 150 }),
      withTiming(0, { duration: 350 })
    );
  };

  useEffect(() => {
    if (isChallengeActive && user) {
      setQuestion(getRandomQuestion('medium'));
      setAnswer('');
      setError('');
    }
  }, [isChallengeActive, user]);

  useEffect(() => {
    if (!isChallengeActive || !user) return;

    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      return true;
    });
    return () => sub.remove();
  }, [isChallengeActive, user]);

  useEffect(() => {
    if (!isChallengeActive || !user) return;

    const triggerHaptic = () => {
      if (Platform.OS === 'android') {
        Vibration.vibrate(ALARM_VIBRATION_PATTERN);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    };

    triggerHaptic();
    const interval = setInterval(triggerHaptic, HAPTIC_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      if (Platform.OS === 'android') {
        Vibration.cancel();
      }
    };
  }, [isChallengeActive, user]);

  const handleSubmit = () => {
    if (!question) return;
    const normalized = answer.trim().toLowerCase();
    const expected = question.answer.trim().toLowerCase();
    if (normalized === expected) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      dismissChallenge();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      shake();
      flashRed();
      setError('Wrong answer. Try again!');
    }
  };

  if (!isChallengeActive || !user) return null;

  return (
    <Animated.View
      style={[
        styles.overlay,
        overlayAnimatedStyle,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
      pointerEvents="auto"
    >
      <StatusBar hidden />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        {/* Mascot */}
        <Image source={BlipHead} style={styles.mascot} resizeMode="contain" />

        {/* Title */}
        <Text style={styles.title}>Answer to continue</Text>
        <Text style={styles.subtitle}>Solve this to unlock your screen</Text>

        {/* Question Card */}
        {question && (
          <View style={styles.questionCard}>
            <Text style={styles.questionLabel}>QUESTION</Text>
            <Text style={styles.questionText}>{question.question}</Text>
          </View>
        )}

        {/* Answer Input */}
        <Animated.View style={[styles.inputWrap, animatedStyle]}>
          <TextInput
            style={styles.input}
            placeholder="Type your answer..."
            placeholderTextColor="#A0A0A0"
            value={answer}
            onChangeText={(t) => {
              setAnswer(t);
              setError('');
            }}
            onSubmitEditing={handleSubmit}
            returnKeyType="done"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </Animated.View>

        {/* Error */}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Submit */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Submit</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: YELLOW,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    maxWidth: 340,
    padding: 24,
    alignItems: 'center',
  },

  mascot: {
    width: 160,
    height: 160,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: DARK,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: DARK_OLIVE,
    textAlign: 'center',
    marginBottom: 24,
  },

  questionCard: {
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  questionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: DARK_OLIVE,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  questionText: {
    fontSize: 28,
    fontWeight: '800',
    color: DARK,
    textAlign: 'center',
  },

  inputWrap: {
    width: '100%',
    marginBottom: 14,
  },
  input: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 16,
    fontSize: 18,
    color: DARK,
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  errorBox: {
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  button: {
    backgroundColor: DARK_OLIVE,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: YELLOW,
    fontSize: 18,
    fontWeight: '700',
  },
});
