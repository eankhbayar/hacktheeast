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
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '@/components/themed-text';
import { useChallenge } from '@/hooks/use-challenge';
import { useAuth } from '@/hooks/use-auth';
import { getRandomQuestion } from '@/lib/questions';

const ALARM_VIBRATION_PATTERN = [0, 800, 400, 800, 400, 800, 400, 800];
const HAPTIC_INTERVAL_MS = 1200;

export function ChallengeOverlay() {
  const { isChallengeActive, dismissChallenge } = useChallenge();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [question, setQuestion] = useState<{ question: string; answer: string } | null>(null);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const shakeX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
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

  useEffect(() => {
    if (isChallengeActive && user) {
      setQuestion(getRandomQuestion('medium'));
      setAnswer('');
      setError('');
    }
  }, [isChallengeActive, user]);

  // Block hardware back button (Android)
  useEffect(() => {
    if (!isChallengeActive || !user) return;

    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      return true;
    });
    return () => sub.remove();
  }, [isChallengeActive, user]);

  // Continuous haptic feedback loop
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
      setError('Wrong answer. Try again!');
    }
  };

  if (!isChallengeActive || !user) return null;

  return (
    <View
      style={[
        styles.overlay,
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
        <ThemedText type="title" style={styles.title}>
          Answer to continue
        </ThemedText>
        {question && (
          <ThemedText style={styles.question}>{question.question}</ThemedText>
        )}
        <Animated.View style={[styles.inputWrap, animatedStyle]}>
          <TextInput
            style={styles.input}
            placeholder="Your answer"
            placeholderTextColor="#9ca3af"
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
        {error ? (
          <ThemedText style={[styles.error, { color: '#dc2626' }]}>
            {error}
          </ThemedText>
        ) : null}
        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <ThemedText lightColor="#fff" darkColor="#fff" style={styles.buttonText}>
            Submit
          </ThemedText>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0f172a',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    maxWidth: 320,
    padding: 24,
  },
  title: {
    color: '#f8fafc',
    marginBottom: 24,
    textAlign: 'center',
  },
  question: {
    color: '#e2e8f0',
    fontSize: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputWrap: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#f8fafc',
  },
  error: {
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#0ea5e9',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
