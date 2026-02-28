import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import {
  requestNotificationPermissions,
  scheduleChallengeNotification,
  cancelChallengeNotification,
  addChallengeNotificationListener,
  scheduleNagNotifications,
  cancelNagNotifications,
} from '@/services/notifications';
import { startAlarmSound, stopAlarmSound } from '@/services/alarm-sound';
import { checkLaunchPayload } from '@/services/alarm-kit';

const STORAGE_KEYS = {
  INTERVAL_MINUTES: 'challenge_interval_minutes',
  NEXT_CHALLENGE_AT: 'challenge_next_at',
  IS_ACTIVE: 'challenge_is_active',
};

const DEFAULT_INTERVAL_MINUTES = 30;

interface ChallengeContextType {
  isChallengeActive: boolean;
  nextChallengeAt: number | null;
  intervalMinutes: number;
  setIntervalMinutes: (minutes: number) => Promise<void>;
  triggerChallenge: () => void;
  dismissChallenge: () => void;
  minutesUntilNext: number | null;
}

const ChallengeContext = createContext<ChallengeContextType | null>(null);

export function ChallengeProvider({ children }: { children: React.ReactNode }) {
  const [isChallengeActive, setIsChallengeActive] = useState(false);
  const [nextChallengeAt, setNextChallengeAt] = useState<number | null>(null);
  const [intervalMinutes, setIntervalMinutesState] = useState(DEFAULT_INTERVAL_MINUTES);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nagRescheduleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);

  const activateChallenge = useCallback(() => {
    setIsChallengeActive(true);
    AsyncStorage.setItem(STORAGE_KEYS.IS_ACTIVE, 'true');
    if (AppState.currentState === 'active') {
      startAlarmSound();
    }
  }, []);

  const persistAndSchedule = useCallback(
    async (nextAt: number) => {
      setNextChallengeAt(nextAt);
      await AsyncStorage.setItem(STORAGE_KEYS.NEXT_CHALLENGE_AT, String(nextAt));
      await AsyncStorage.setItem(STORAGE_KEYS.IS_ACTIVE, 'false');

      if (timerRef.current) clearTimeout(timerRef.current);
      const delay = Math.max(0, nextAt - Date.now());
      timerRef.current = setTimeout(() => {
        activateChallenge();
      }, delay);

      await scheduleChallengeNotification(nextAt);
    },
    [activateChallenge]
  );

  const setIntervalMinutes = useCallback(
    async (minutes: number) => {
      setIntervalMinutesState(minutes);
      await AsyncStorage.setItem(STORAGE_KEYS.INTERVAL_MINUTES, String(minutes));
      if (!isChallengeActive) {
        const nextAt = Date.now() + minutes * 60 * 1000;
        await persistAndSchedule(nextAt);
      }
    },
    [isChallengeActive, persistAndSchedule]
  );

  const triggerChallenge = useCallback(async () => {
    activateChallenge();
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    await cancelChallengeNotification();
  }, [activateChallenge]);

  const dismissChallenge = useCallback(async () => {
    setIsChallengeActive(false);
    await AsyncStorage.setItem(STORAGE_KEYS.IS_ACTIVE, 'false');
    if (nagRescheduleRef.current) {
      clearInterval(nagRescheduleRef.current);
      nagRescheduleRef.current = null;
    }
    await stopAlarmSound();
    await cancelNagNotifications();
    await cancelChallengeNotification();
    const nextAt = Date.now() + intervalMinutes * 60 * 1000;
    await persistAndSchedule(nextAt);
  }, [intervalMinutes, persistAndSchedule]);

  const minutesUntilNext =
    nextChallengeAt && !isChallengeActive
      ? Math.max(0, Math.ceil((nextChallengeAt - Date.now()) / 60000))
      : null;

  // Re-engage alarm when app returns to foreground while challenge is active
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        isChallengeActive
      ) {
        startAlarmSound();
      }
      appStateRef.current = nextAppState;
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [isChallengeActive]);

  // Check for missed challenges when returning from background
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState !== 'active') return;

      AsyncStorage.getItem(STORAGE_KEYS.IS_ACTIVE).then((v) => {
        if (v === 'true' && !isChallengeActive) {
          activateChallenge();
        }
      });

      if (nextChallengeAt && nextChallengeAt <= Date.now() && !isChallengeActive) {
        activateChallenge();
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [isChallengeActive, nextChallengeAt, activateChallenge]);

  useEffect(() => {
    let mounted = true;

    const alarmPayload = checkLaunchPayload();
    if (alarmPayload) {
      activateChallenge();
    } else {
      const lastResponse = Notifications.getLastNotificationResponse?.();
      if (lastResponse) {
        const data = lastResponse.notification.request.content.data as Record<string, unknown>;
        if (data?.type === 'challenge-due') {
          activateChallenge();
          Notifications.clearLastNotificationResponse?.();
        }
      }
    }

    async function init() {
      requestNotificationPermissions();
      const [storedInterval, storedNext, storedActive] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.INTERVAL_MINUTES),
        AsyncStorage.getItem(STORAGE_KEYS.NEXT_CHALLENGE_AT),
        AsyncStorage.getItem(STORAGE_KEYS.IS_ACTIVE),
      ]);

      const interval = storedInterval ? parseInt(storedInterval, 10) : DEFAULT_INTERVAL_MINUTES;
      const nextAt = storedNext ? parseInt(storedNext, 10) : null;
      const active = storedActive === 'true';

      if (mounted) {
        setIntervalMinutesState(interval);
        if (active) {
          activateChallenge();
        } else if (nextAt && nextAt > Date.now()) {
          setNextChallengeAt(nextAt);
          const delay = nextAt - Date.now();
          timerRef.current = setTimeout(() => {
            if (mounted) activateChallenge();
          }, delay);
        } else {
          const next = Date.now() + interval * 60 * 1000;
          await persistAndSchedule(next);
        }
      }
    }

    init();
    return () => {
      mounted = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [persistAndSchedule, activateChallenge]);

  useEffect(() => {
    const remove = addChallengeNotificationListener(() => {
      activateChallenge();
    });
    return remove;
  }, [activateChallenge]);

  // When challenge is active, cancel the original alarm and start nagging
  // via repeated critical notifications every 30 seconds.
  useEffect(() => {
    if (!isChallengeActive) return;

    cancelChallengeNotification();
    cancelNagNotifications().then(() => scheduleNagNotifications());

    const RESCHEDULE_MS = 25 * 60 * 1000;
    nagRescheduleRef.current = setInterval(() => {
      cancelNagNotifications().then(() => scheduleNagNotifications());
    }, RESCHEDULE_MS);

    return () => {
      if (nagRescheduleRef.current) {
        clearInterval(nagRescheduleRef.current);
        nagRescheduleRef.current = null;
      }
      cancelNagNotifications();
    };
  }, [isChallengeActive]);

  return (
    <ChallengeContext.Provider
      value={{
        isChallengeActive,
        nextChallengeAt,
        intervalMinutes,
        setIntervalMinutes,
        triggerChallenge,
        dismissChallenge,
        minutesUntilNext,
      }}
    >
      {children}
    </ChallengeContext.Provider>
  );
}

export function useChallenge() {
  const ctx = useContext(ChallengeContext);
  if (!ctx) throw new Error('useChallenge must be used within ChallengeProvider');
  return ctx;
}
