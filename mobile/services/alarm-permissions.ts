import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { requestNotificationPermissions } from './notifications';

export type AlarmPermissionStatus = {
  notificationsGranted: boolean;
  criticalAlertsGranted: boolean;
  alarmPermissionNeeded: boolean;
};

export async function getAlarmPermissionStatus(): Promise<AlarmPermissionStatus> {
  const settings = await Notifications.getPermissionsAsync();
  const notificationsGranted = settings.status === 'granted';

  // iOS critical alerts are part of the notification permission bundle;
  // there's no separate runtime check via expo-notifications, so we
  // optimistically assume granted when notifications are granted and
  // the entitlement is present.
  const criticalAlertsGranted =
    Platform.OS === 'ios' && notificationsGranted;

  const alarmPermissionNeeded =
    Platform.OS === 'android' && !notificationsGranted;

  return { notificationsGranted, criticalAlertsGranted, alarmPermissionNeeded };
}

export async function requestAlarmPermissions(): Promise<boolean> {
  return requestNotificationPermissions();
}

export async function openAppSettings(): Promise<void> {
  await Linking.openSettings();
}
