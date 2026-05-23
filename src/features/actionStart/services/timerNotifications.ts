/**
 * ローカル通知のみ使用（Expo Go Android 対応）。
 * `expo-notifications` のメインエントリは Push 自動登録を読み込むため、
 * サブパスから必要な API だけ import する。
 *
 * v1: Expo Go で不安定なためデフォルトオフ。
 * development build 利用時に true に切り替え可能。
 */
import {
  getPermissionsAsync,
  requestPermissionsAsync,
} from 'expo-notifications/build/NotificationPermissions';
import { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
import { SchedulableTriggerInputTypes } from 'expo-notifications/build/Notifications.types';
import { cancelScheduledNotificationAsync } from 'expo-notifications/build/cancelScheduledNotificationAsync';
import { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';

/** Expo Go では false。development build で true に切り替え */
export const ENABLE_NOTIFICATIONS = false;

let scheduledNotificationId: string | null = null;
let permissionRequested = false;
let handlerConfigured = false;

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

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!ENABLE_NOTIFICATIONS) {
    return false;
  }
  configureNotificationHandler();

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
  if (!ENABLE_NOTIFICATIONS || !scheduledNotificationId) {
    scheduledNotificationId = null;
    return;
  }
  await cancelScheduledNotificationAsync(scheduledNotificationId);
  scheduledNotificationId = null;
}

export async function scheduleTimerNotification(
  seconds: number,
): Promise<void> {
  if (!ENABLE_NOTIFICATIONS) {
    return;
  }
  await cancelTimerNotification();

  const granted = await ensureNotificationPermission();
  if (!granted || seconds <= 0) {
    return;
  }

  const id = await scheduleNotificationAsync({
    content: {
      title: 'Eskeri',
      body: '開始',
    },
    trigger: {
      type: SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(1, Math.ceil(seconds)),
    },
  });

  scheduledNotificationId = id;
}
