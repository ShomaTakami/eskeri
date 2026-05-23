/**
 * ローカル通知のみ（Push / Expo Push Token は使用しない）。
 * メインエントリ import は Push 自動登録を読み込むため、サブパス import に限定。
 */
import { Platform } from 'react-native';

import { AndroidImportance } from 'expo-notifications/build/NotificationChannelManager.types';
import {
  getPermissionsAsync,
  requestPermissionsAsync,
} from 'expo-notifications/build/NotificationPermissions';
import { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
import { SchedulableTriggerInputTypes } from 'expo-notifications/build/Notifications.types';
import { cancelScheduledNotificationAsync } from 'expo-notifications/build/cancelScheduledNotificationAsync';
import { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';
import { setNotificationChannelAsync } from 'expo-notifications/build/setNotificationChannelAsync';

/** development build / 本番向け。Expo Go では不安定な場合あり */
export const ENABLE_NOTIFICATIONS = true;

const TIMER_CHANNEL_ID = 'eskeri-timer';

let scheduledNotificationId: string | null = null;
let permissionRequested = false;
let handlerConfigured = false;
let androidChannelReady = false;

function configureNotificationHandler(): void {
  if (!ENABLE_NOTIFICATIONS || handlerConfigured) {
    return;
  }
  handlerConfigured = true;
  setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android' || androidChannelReady) {
    return;
  }
  try {
    await setNotificationChannelAsync(TIMER_CHANNEL_ID, {
      name: 'タイマー',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    });
    androidChannelReady = true;
  } catch (error) {
    console.warn('[notifications] Android channel setup failed', error);
  }
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!ENABLE_NOTIFICATIONS) {
    return false;
  }
  configureNotificationHandler();
  await ensureAndroidChannel();

  const current = await getPermissionsAsync();
  if (current.granted) {
    return true;
  }
  if (!permissionRequested) {
    permissionRequested = true;
    const requested = await requestPermissionsAsync();
    return requested.granted;
  }
  return false;
}

export async function cancelTimerNotification(): Promise<void> {
  if (!ENABLE_NOTIFICATIONS) {
    scheduledNotificationId = null;
    return;
  }
  if (!scheduledNotificationId) {
    return;
  }
  try {
    await cancelScheduledNotificationAsync(scheduledNotificationId);
  } catch (error) {
    console.warn('[notifications] cancel failed', error);
  } finally {
    scheduledNotificationId = null;
  }
}

export async function scheduleTimerNotification(
  seconds: number,
): Promise<void> {
  if (!ENABLE_NOTIFICATIONS) {
    return;
  }
  const delaySeconds = Math.max(1, Math.ceil(seconds));
  if (delaySeconds <= 0) {
    return;
  }

  try {
    await cancelTimerNotification();

    const granted = await ensureNotificationPermission();
    if (!granted) {
      return;
    }

    const id = await scheduleNotificationAsync({
      content: {
        title: 'Eskeri',
        body: '終了',
        ...(Platform.OS === 'android' ? { channelId: TIMER_CHANNEL_ID } : {}),
      },
      trigger: {
        type: SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: delaySeconds,
      },
    });

    scheduledNotificationId = id;
  } catch (error) {
    console.warn('[notifications] schedule failed', error);
    scheduledNotificationId = null;
  }
}
