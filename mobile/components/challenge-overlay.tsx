import React, { useState, useEffect, useCallback } from 'react';
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
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useChallenge } from '@/hooks/use-challenge';
import { useAuth } from '@/hooks/use-auth';
import api from '@/services/api';
import { BlipHead } from '@/images';
import type { Question, Lesson, AnswerResult, RemediationResult } from '@/types/children';

const ALARM_VIBRATION_PATTERN = [0, 800, 400, 800, 400, 800, 400, 800];
const HAPTIC_INTERVAL_MS = 1200;

const YELLOW = '#FFD600';
const DARK = '#2E2E00';
const DARK_OLIVE = '#3D3B00';
const WHITE = '#FFFFFF';

type OverlayStage = 'loading' | 'questioning' | 'remediation_video' | 'remediation_question' | 'error';

export function ChallengeOverlay() {
  const { isChallengeActive, dismissChallenge, activeChildId } = useChallenge();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [stage, setStage] = useState<OverlayStage>('loading');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [strikesRemaining, setStrikesRemaining] = useState<number | null>(null);
  const shakeX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const shake = useCallback(() => {
    shakeX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  }, []);

  const handleGoToHomeAndDismiss = useCallback(async () => {
    await dismissChallenge();
    router.replace('/(tabs)');
  }, [dismissChallenge]);

  const triggerSession = useCallback(async () => {
    if (!activeChildId) {
      setStage('error');
      setError('No child profile selected. Select a kid on the home screen.');
      return;
    }
    setStage('loading');
    setError('');
    try {
      const res = await api.post<{ session: { sessionId: string }; question: Question }>(
        '/sessions/trigger',
        { childId: activeChildId, triggerType: 'manual' }
      );
      setSessionId(res.data.session.sessionId);
      setQuestion(res.data.question);
      setStage('questioning');
      setAnswer('');
      setStrikesRemaining(3);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { error?: string } } })?.response?.data;
      const status = (err as { response?: { status?: number } })?.response?.status;
      setStage('error');
      setError(
        status === 404
          ? 'No child profile found. Select a kid on the home screen to continue.'
          : status === 409
            ? 'An active session exists. Ask a parent to unlock from the dashboard.'
            : (data?.error ?? 'Failed to start challenge')
      );
    }
  }, [activeChildId]);

  useEffect(() => {
    if (isChallengeActive && user) {
      triggerSession();
    }
  }, [isChallengeActive, user]);

  useEffect(() => {
    if (!isChallengeActive) {
      setSessionId(null);
      setQuestion(null);
      setLesson(null);
      setStage('loading');
      setAnswer('');
      setError('');
      setStrikesRemaining(null);
    }
  }, [isChallengeActive]);

  useEffect(() => {
    if (!isChallengeActive || !user) return;

    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
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

  const handleSubmitAnswer = useCallback(async () => {
    if (!sessionId || !question) return;
    const submittedAnswer = answer.trim();
    if (!submittedAnswer) {
      setError('Please enter an answer');
      return;
    }

    setError('');
    try {
      const res = await api.post<AnswerResult>(`/sessions/${sessionId}/answer`, {
        questionId: question.questionId,
        answer: submittedAnswer,
      });
      const data = res.data;

      if (data.result === 'correct') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        dismissChallenge();
        return;
      }

      if (data.result === 'incorrect') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        shake();
        setAnswer('');
        if (data.nextQuestion) {
          setQuestion(data.nextQuestion);
          setStrikesRemaining(data.strikesRemaining ?? null);
        }
        setError('Wrong answer. Try again!');
        return;
      }

      if (data.result === 'locked' && data.lesson) {
        setLesson(data.lesson);
        setStage('remediation_video');
        setAnswer('');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to submit';
      setError(msg);
    }
  }, [sessionId, question, answer, dismissChallenge, shake]);

  const handleVideoComplete = useCallback(async () => {
    if (!sessionId) return;
    try {
      await api.post(`/sessions/${sessionId}/video-complete`);
      setStage('remediation_question');
    } catch {
      setError('Failed to continue');
    }
  }, [sessionId]);

  const handleRemediationAnswer = useCallback(async () => {
    if (!sessionId || !question) return;
    const submittedAnswer = answer.trim();
    if (!submittedAnswer) {
      setError('Please enter an answer');
      return;
    }

    setError('');
    try {
      const res = await api.post<RemediationResult>(`/sessions/${sessionId}/remediation-answer`, {
        answer: submittedAnswer,
      });
      const data = res.data;

      if (data.result === 'correct') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        dismissChallenge();
        return;
      }

      if (data.result === 'incorrect' && data.rewatchRequired) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        shake();
        setStage('remediation_video');
        setAnswer('');
        setError('Wrong answer. Watch the video again and try again.');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to submit';
      setError(msg);
    }
  }, [sessionId, question, answer, dismissChallenge, shake]);

  const handleOptionSelect = (option: string) => {
    setAnswer(option);
    setError('');
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
        <Image source={BlipHead} style={styles.mascot} resizeMode="contain" />
        <Text style={styles.title}>Answer to continue</Text>
        <Text style={styles.subtitle}>Solve this to unlock your screen</Text>

        {stage === 'loading' && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={DARK_OLIVE} />
            <Text style={styles.loadingText}>Loading question...</Text>
          </View>
        )}

        {stage === 'error' && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={handleGoToHomeAndDismiss}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Select a Kid</Text>
            </TouchableOpacity>
          </View>
        )}

        {stage === 'remediation_video' && lesson && (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.questionCard}>
              <Text style={styles.questionLabel}>WATCH THIS LESSON</Text>
              <Text style={styles.videoTitle}>{lesson.topic}</Text>
              <Text style={styles.videoDesc}>{lesson.description}</Text>
              <Text style={styles.videoNote}>
                Video: {lesson.durationSeconds}s • {lesson.videoUrl ? 'Open in browser' : 'Placeholder'}
              </Text>
            </View>
            <TouchableOpacity style={styles.button} onPress={handleVideoComplete} activeOpacity={0.8}>
              <Text style={styles.buttonText}>I&apos;ve watched the video</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {(stage === 'questioning' || stage === 'remediation_question') && question && (
          <>
            <View style={styles.questionCard}>
              <Text style={styles.questionLabel}>QUESTION</Text>
              <Text style={styles.questionText}>{question.questionText}</Text>
              {strikesRemaining !== null && stage === 'questioning' && (
                <Text style={styles.strikesText}>{strikesRemaining} tries left</Text>
              )}
            </View>

            {question.options && question.options.length > 0 ? (
              <View style={styles.optionsWrap}>
                {question.options.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.optionBtn, answer === opt && styles.optionBtnActive]}
                    onPress={() => handleOptionSelect(opt)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.optionText, answer === opt && styles.optionTextActive]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
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
                  onSubmitEditing={stage === 'remediation_question' ? handleRemediationAnswer : handleSubmitAnswer}
                  returnKeyType="done"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </Animated.View>
            )}

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.button}
              onPress={stage === 'remediation_question' ? handleRemediationAnswer : handleSubmitAnswer}
              activeOpacity={0.8}
              disabled={!answer.trim()}
            >
              <Text style={[styles.buttonText, !answer.trim() && styles.buttonTextDisabled]}>Submit</Text>
            </TouchableOpacity>
          </>
        )}
      </KeyboardAvoidingView>
    </View>
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
  scroll: {
    width: '100%',
    maxHeight: 400,
  },
  scrollContent: {
    paddingBottom: 20,
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

  loadingWrap: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: DARK_OLIVE,
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
  strikesText: {
    fontSize: 12,
    color: DARK_OLIVE,
    marginTop: 8,
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
    marginBottom: 8,
  },
  videoDesc: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
  },
  videoNote: {
    fontSize: 12,
    color: '#888',
    marginTop: 12,
  },

  optionsWrap: {
    width: '100%',
    marginBottom: 14,
  },
  optionBtn: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginBottom: 10,
  },
  optionBtnActive: {
    borderColor: DARK_OLIVE,
    backgroundColor: '#FFFDE7',
  },
  optionText: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
  },
  optionTextActive: {
    color: DARK_OLIVE,
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
    width: '100%',
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
  buttonTextDisabled: {
    opacity: 0.6,
  },
});
