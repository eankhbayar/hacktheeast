import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
  isAlarmKitAvailable,
  scheduleChallengeAlarm as scheduleAlarmKit,
  cancelChallengeAlarm as cancelAlarmKit,
} from './alarm-kit';

export const CHALLENGE_DUE_ID = 'challenge-due';
const CHALLENGE_CHANNEL_ID = 'challenge-alarm';
const NAG_CHANNEL_ID = 'challenge-nag';

// iOS notification sounds play up to 30 seconds. A new notification fires
// every 30 seconds so the alarm sound restarts seamlessly.
const ALARM_SOUND_DURATION_SECONDS = 30;
const NAG_COUNT = 60;

function isChallengeDueNotification(
  data: Record<string, unknown> | undefined
): boolean {
  return data?.type === 'challenge-due';
}

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const isChallenge = isChallengeDueNotification(
      notification.request.content.data as Record<string, unknown>
    );
    return {
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowAlert: isChallenge,
    };
  },
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  if (Platform.OS === 'ios') {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowCriticalAlerts: true,
      },
    });
    return status === 'granted';
  }

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHALLENGE_CHANNEL_ID, {
      name: 'Challenge Alarm',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 800, 400, 800, 400, 800],
      sound: 'alarm.mp3',
      enableVibrate: true,
    });
    await Notifications.setNotificationChannelAsync(NAG_CHANNEL_ID, {
      name: 'Challenge Reminder',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 800, 400, 800, 400, 800],
      sound: 'alarm.mp3',
      enableVibrate: true,
    });
  }
}

function alarmNotificationContent(
  title: string,
  body: string
): Notifications.NotificationContentInput {
  return {
    title,
    body,
    data: { type: 'challenge-due' },
    sound: 'alarm.mp3',
    priority: Notifications.AndroidNotificationPriority.MAX,
    ...(Platform.OS === 'ios' && { interruptionLevel: 'critical' }),
    ...(Platform.OS === 'android' && {
      channelId: CHALLENGE_CHANNEL_ID,
      vibrate: [0, 800, 400, 800, 400, 800],
    }),
  };
}

export async function scheduleChallengeNotification(nextAt: number): Promise<void> {
  if (isAlarmKitAvailable()) {
    const ok = await scheduleAlarmKit(nextAt);
    if (ok) return;
  }

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  await setupNotificationChannel();
  await cancelChallengeNotification();

  await Notifications.scheduleNotificationAsync({
    identifier: CHALLENGE_DUE_ID,
    content: {
      title: 'Answer to continue',
      body: 'Your challenge is ready. You cannot use the app until you answer.',
      data: { type: 'challenge-due' },
      sound: 'alarm.mp3',
      priority: Notifications.AndroidNotificationPriority.MAX,
      ...(Platform.OS === 'ios' && { interruptionLevel: 'critical' }),
      ...(Platform.OS === 'android' && {
        channelId: CHALLENGE_CHANNEL_ID,
        vibrate: [0, 800, 400, 800, 400, 800],
      }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: nextAt,
      ...(Platform.OS === 'android' && { channelId: CHALLENGE_CHANNEL_ID }),
    },
  });
}

export async function cancelChallengeNotification(): Promise<void> {
  await cancelAlarmKit();
  try {
    await Notifications.cancelScheduledNotificationAsync(CHALLENGE_DUE_ID);
  } catch {
    /* ignore */
  }
}

export function addChallengeNotificationListener(
  onChallengeDue: () => void
): () => void {
  const subReceived = Notifications.addNotificationReceivedListener(
    (notification) => {
      if (isChallengeDueNotification(notification.request.content.data as Record<string, unknown>)) {
        onChallengeDue();
      }
    }
  );
  const subResponse = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      if (isChallengeDueNotification(response.notification.request.content.data as Record<string, unknown>)) {
        onChallengeDue();
      }
    }
  );
  return () => {
    subReceived.remove();
    subResponse.remove();
  };
}

export async function scheduleNagNotifications(): Promise<void> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  await setupNotificationChannel();

  for (let i = 1; i <= NAG_COUNT; i++) {
    await Notifications.scheduleNotificationAsync({
      content: alarmNotificationContent(
        'Answer your challenge!',
        'You must solve the challenge to continue.'
      ),
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: i * ALARM_SOUND_DURATION_SECONDS,
        repeats: false,
        ...(Platform.OS === 'android' && { channelId: NAG_CHANNEL_ID }),
      },
    });
  }
}

export async function cancelNagNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
