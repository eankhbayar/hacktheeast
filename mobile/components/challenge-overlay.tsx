import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  ActivityIndicator,
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
import { useAppMode } from '@/contexts/app-mode';
import { useKids } from '@/contexts/kids';
import { triggerSession, submitAnswer } from '@/services/sessions';
import type { Question } from '@/types/children';
import { stopAlarmSound } from '@/services/alarm-sound';
import { BlipHead, BlipRobot } from '@/images';

const WRONG_ANSWER_DELAY_MS = 700;
const ALARM_VIBRATION_PATTERN = [0, 800, 400, 800, 400, 800, 400, 800];
const HAPTIC_INTERVAL_MS = 1200;

const YELLOW = '#FFD600';
const DARK = '#2E2E00';
const DARK_OLIVE = '#3D3B00';
const WHITE = '#FFFFFF';

const ENCOURAGEMENTS = [
  'Great job!',
  'You nailed it!',
  'Awesome work!',
  'Well done!',
  'Keep it up!',
  'Brilliant!',
];

interface WrongAnswer {
  questionIndex: number;
  question: string;
  correctAnswer: string;
}

type Phase = 'quiz' | 'success' | 'review';

export function ChallengeOverlay() {
  const { isChallengeActive, dismissChallenge, pauseNags } = useChallenge();
  const { user } = useAuth();
  const { mode, childModeKid } = useAppMode();
  const { kids } = useKids();
  const insets = useSafeAreaInsets();
  const activeKids = kids.filter((k) => k.isActive);
  const currentChildId =
    childModeKid?.childId ?? activeKids[0]?.childId ?? null;

  // Session-backed state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<Phase>('quiz');
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shakeX = useSharedValue(0);
  const bgFlash = useSharedValue(0);

  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');

  const isChildMode = mode === 'child';
  const canShow = isChallengeActive && (user || isChildMode);

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

  const finishDismiss = useCallback(() => {
    setPhase('quiz');
    dismissChallenge();
  }, [dismissChallenge]);

  // Fetch question from API when challenge starts
  useEffect(() => {
    if (!isChallengeActive || !(user || isChildMode) || !currentChildId) return;

    pauseNags();
    stopAlarmSound();
    setSessionId(null);
    setQuestion(null);
    setPhase('quiz');
    setWrongAnswers([]);
    setReviewIndex(0);
    setAnswer('');
    setError('');
    setLoading(true);

    triggerSession(currentChildId, 'schedule')
      .then(({ session, question: q }) => {
        setSessionId(session.sessionId);
        setQuestion(q);
      })
      .catch(() => {
        setError('Failed to load question. Try again.');
      })
      .finally(() => setLoading(false));
  }, [isChallengeActive, user, isChildMode, currentChildId, pauseNags]);

  // Block hardware back button
  useEffect(() => {
    if (!canShow) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [canShow]);

  // Haptic alarm loop — runs only during quiz phase
  useEffect(() => {
    if (!canShow || (isChildMode && phase !== 'quiz')) return;

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
      if (Platform.OS === 'android') Vibration.cancel();
    };
  }, [canShow, isChildMode, phase]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  const handleSubmit = async () => {
    if (!sessionId || !question || transitioning) return;

    setTransitioning(true);
    setError('');

    try {
      const result = await submitAnswer(
        sessionId,
        question.questionId,
        answer.trim()
      );

      if (result.result === 'correct' && result.sessionComplete) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        stopAlarmSound();
        const msg =
          ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
        setSuccessMessage(msg);
        setPhase('success');
        successTimerRef.current = setTimeout(finishDismiss, 2000);
        return;
      }

      if (result.result === 'incorrect') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        shake();
        flashRed();
        const newWrong: WrongAnswer[] = [
          ...wrongAnswers,
          {
            questionIndex: wrongAnswers.length,
            question: question.questionText,
            correctAnswer: question.correctAnswer,
          },
        ];
        setWrongAnswers(newWrong);
        if (result.nextQuestion) {
          setQuestion(result.nextQuestion);
          setAnswer('');
        } else {
          setError('Wrong answer. Try again!');
        }
        return;
      }

      if (result.result === 'locked') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        const newWrong: WrongAnswer[] = [
          ...wrongAnswers,
          {
            questionIndex: wrongAnswers.length,
            question: question.questionText,
            correctAnswer: question.correctAnswer,
          },
        ];
        setWrongAnswers(newWrong);
        setReviewIndex(0);
        setPhase('review');
      }
    } catch {
      setError('Failed to submit. Try again.');
    } finally {
      setTransitioning(false);
    }
  };

  const handleReviewNext = () => {
    if (reviewIndex < wrongAnswers.length - 1) {
      setReviewIndex(reviewIndex + 1);
    } else {
      const msg = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
      setSuccessMessage(msg);
      setPhase('success');
      successTimerRef.current = setTimeout(finishDismiss, 2000);
    }
  };

  if (!canShow) return null;

  if (!currentChildId) {
    return (
      <View
        style={[
          styles.overlay,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
        pointerEvents="auto"
      >
        <StatusBar hidden />
        <Text style={styles.title}>No child selected</Text>
        <Text style={styles.subtitle}>
          Add and activate a kid in Settings to start challenges.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={finishDismiss}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Success screen ──
  if (phase === 'success' && isChildMode) {
    return (
      <View
        style={[
          styles.overlay,
          styles.successOverlay,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
        pointerEvents="auto"
      >
        <StatusBar hidden />
        <Image source={BlipRobot} style={styles.successMascot} resizeMode="contain" />
        <Text style={styles.successText}>{successMessage}</Text>
        <Text style={styles.successSub}>Timer restarting...</Text>
      </View>
    );
  }

  // ── Review screen (explanation cards for wrong answers) ──
  if (phase === 'review' && isChildMode) {
    const wrong = wrongAnswers[reviewIndex];
    return (
      <View
        style={[
          styles.overlay,
          styles.reviewOverlay,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
        pointerEvents="auto"
      >
        <StatusBar hidden />
        <View style={styles.reviewInner}>
          <Text style={styles.reviewTitle}>Let's Review</Text>
          <Text style={styles.reviewProgress}>
            {reviewIndex + 1} of {wrongAnswers.length} to review
          </Text>

          <View style={styles.explanationCard}>
            <View style={styles.explanationImagePlaceholder}>
              <Text style={styles.explanationImageIcon}>📚</Text>
            </View>
            <Text style={styles.explanationLabel}>
              Question {wrong.questionIndex + 1} Explanation
            </Text>
            <Text style={styles.explanationQuestion}>{wrong.question}</Text>
            <Text style={styles.explanationAnswer}>
              Answer: {wrong.correctAnswer}
            </Text>
            <Text style={styles.explanationBody}>
              Lesson content will appear here. This is a placeholder for the
              learning material related to this question.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.reviewButton}
            onPress={handleReviewNext}
            activeOpacity={0.8}
          >
            <Text style={styles.reviewButtonText}>
              {reviewIndex < wrongAnswers.length - 1 ? 'Next' : 'Done'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Loading ──
  if (loading) {
    return (
      <View
        style={[
          styles.overlay,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
        pointerEvents="auto"
      >
        <StatusBar hidden />
        <ActivityIndicator size="large" color={DARK_OLIVE} />
        <Text style={[styles.subtitle, { marginTop: 16 }]}>
          Loading question...
        </Text>
      </View>
    );
  }

  // ── Error (no question loaded) ──
  if (!question && error) {
    return (
      <View
        style={[
          styles.overlay,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
        pointerEvents="auto"
      >
        <StatusBar hidden />
        <Text style={styles.title}>Oops</Text>
        <Text style={[styles.subtitle, { marginBottom: 24 }]}>{error}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={finishDismiss}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Quiz screen ──
  return (
    <Animated.View
      style={[
        styles.overlay,
        overlayAnimatedStyle,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
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
        <Text style={styles.subtitle}>
          {isChildMode
            ? 'Solve this to unlock your screen'
            : 'Solve this to unlock your screen'}
        </Text>

        {question && (
          <View style={styles.questionCard}>
            <Text style={styles.questionLabel}>QUESTION</Text>
            <Text style={styles.questionText}>{question.questionText}</Text>
          </View>
        )}

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
            editable={!transitioning}
          />
        </Animated.View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.button, transitioning && styles.buttonDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.8}
          disabled={transitioning}
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

  // Progress dots
  progressRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  progressDotDone: {
    backgroundColor: DARK_OLIVE,
  },
  progressDotCurrent: {
    backgroundColor: DARK,
    transform: [{ scale: 1.3 }],
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
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: YELLOW,
    fontSize: 18,
    fontWeight: '700',
  },

  // Success screen
  successOverlay: {
    backgroundColor: '#4CAF50',
  },
  successMascot: {
    width: 200,
    height: 200,
    marginBottom: 24,
  },
  successText: {
    fontSize: 36,
    fontWeight: '800',
    color: WHITE,
    textAlign: 'center',
    marginBottom: 8,
  },
  successSub: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },

  // Review / explanation screen
  reviewOverlay: {
    backgroundColor: '#1A237E',
  },
  reviewInner: {
    width: '100%',
    maxWidth: 340,
    padding: 24,
    alignItems: 'center',
  },
  reviewTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: WHITE,
    textAlign: 'center',
    marginBottom: 4,
  },
  reviewProgress: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 24,
  },

  explanationCard: {
    backgroundColor: WHITE,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  explanationImagePlaceholder: {
    width: '100%',
    height: 140,
    backgroundColor: '#E8EAF6',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  explanationImageIcon: {
    fontSize: 48,
  },
  explanationLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A237E',
    marginBottom: 8,
  },
  explanationQuestion: {
    fontSize: 22,
    fontWeight: '800',
    color: DARK,
    textAlign: 'center',
    marginBottom: 8,
  },
  explanationAnswer: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 12,
  },
  explanationBody: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },

  reviewButton: {
    backgroundColor: WHITE,
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
  reviewButtonText: {
    color: '#1A237E',
    fontSize: 18,
    fontWeight: '700',
  },
});
