import { Platform } from 'react-native';

export const APP_GROUP_ID = 'group.com.yourcompany.myapp';
export const CHALLENGE_ALARM_ID = 'challenge-due';

const DISMISS_PAYLOAD = 'challenge-due';
const SNOOZE_PAYLOAD = 'challenge-snoozed';
const SNOOZE_DURATION_SECONDS = 300;

type ScheduleAlarmOptions = {
  id: string;
  epochSeconds: number;
  title: string;
  soundName?: string;
  launchAppOnDismiss?: boolean;
  dismissPayload?: string;
  doSnoozeIntent?: boolean;
  launchAppOnSnooze?: boolean;
  snoozePayload?: string;
  snoozeDuration?: number;
  stopButtonLabel?: string;
  snoozeButtonLabel?: string;
  stopButtonColor?: string;
  snoozeButtonColor?: string;
  tintColor?: string;
};

type LaunchPayload = { alarmId: string; payload: string | null };

type AlarmKitModule = {
  configure: (id: string) => boolean;
  requestAuthorization: () => Promise<string>;
  scheduleAlarm: (opts: ScheduleAlarmOptions) => Promise<boolean>;
  cancelAlarm: (id: string) => Promise<boolean>;
  getLaunchPayload: () => LaunchPayload | null;
  generateUUID: () => string;
  getAllAlarms: () => string[];
};

let AlarmKit: AlarmKitModule | null = null;

try {
  const mod = require('expo-alarm-kit');
  AlarmKit = mod.default || mod;
} catch {
  AlarmKit = null;
}

let isConfigured = false;

function ensureConfigured(): boolean {
  if (!AlarmKit || Platform.OS !== 'ios') return false;
  if (isConfigured) return true;
  isConfigured = AlarmKit.configure(APP_GROUP_ID);
  return isConfigured;
}

export function isAlarmKitAvailable(): boolean {
  return !!AlarmKit && Platform.OS === 'ios' && ensureConfigured();
}

export async function requestAlarmAuthorization(): Promise<boolean> {
  if (!AlarmKit || !isAlarmKitAvailable()) return false;
  try {
    const status = await AlarmKit.requestAuthorization();
    return status === 'authorized';
  } catch {
    return false;
  }
}

export async function scheduleChallengeAlarm(nextAt: number): Promise<boolean> {
  if (!AlarmKit || !isAlarmKitAvailable()) return false;
  try {
    await cancelChallengeAlarm();
    const ok = await AlarmKit.scheduleAlarm({
      id: CHALLENGE_ALARM_ID,
      epochSeconds: Math.floor(nextAt / 1000),
      title: 'Answer to continue',
      soundName: 'alarm.mp3',
      launchAppOnDismiss: true,
      dismissPayload: DISMISS_PAYLOAD,
      doSnoozeIntent: true,
      launchAppOnSnooze: true,
      snoozePayload: SNOOZE_PAYLOAD,
      snoozeDuration: SNOOZE_DURATION_SECONDS,
      stopButtonLabel: 'Solve',
      snoozeButtonLabel: 'Snooze (5 min)',
    });
    return ok;
  } catch {
    return false;
  }
}

export async function cancelChallengeAlarm(): Promise<boolean> {
  if (!AlarmKit || !isAlarmKitAvailable()) return false;
  try {
    return await AlarmKit.cancelAlarm(CHALLENGE_ALARM_ID);
  } catch {
    return false;
  }
}

export function checkLaunchPayload(): LaunchPayload | null {
  if (!AlarmKit || !isAlarmKitAvailable()) return null;
  try {
    const payload = AlarmKit.getLaunchPayload();
    if (
      payload &&
      (payload.payload === DISMISS_PAYLOAD || payload.payload === SNOOZE_PAYLOAD)
    ) {
      return payload;
    }
    return null;
  } catch {
    return null;
  }
}

export function configureAlarmKit(): boolean {
  if (!AlarmKit || Platform.OS !== 'ios') return false;
  try {
    isConfigured = AlarmKit.configure(APP_GROUP_ID);
    return isConfigured;
  } catch {
    return false;
  }
}
