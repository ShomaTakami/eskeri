/**
 * ローカル通知のみ（Push / Expo Push Token は使用しない）。
 * SDK 46 / expo-notifications@0.16
 */
import * as Notifications from 'expo-notifications';
import { Linking } from 'react-native';

import { buildTimerNotificationData } from '../constants/notificationScreens';
import {
  isNotificationUserEnabled,
} from '../../settings/storage/notificationPreferences';
import {
  handleNotificationResponse,
} from '../../../navigation/notificationNavigation';

export const ENABLE_NOTIFICATIONS = true;

export type NotificationPermissionSnapshot = {
  granted: boolean;
  status: string;
  canAskAgain: boolean;
  needsSettings: boolean;
};

export async function getNotificationPermissionSnapshot(): Promise<NotificationPermissionSnapshot> {
  const current = await Notifications.getPermissionsAsync();
  const granted = current.granted === true;
  return {
    granted,
    status: current.status,
    canAskAgain: current.canAskAgain ?? true,
    needsSettings: !granted,
  };
}

export async function openNotificationSettings(): Promise<void> {
  try {
    await Linking.openSettings();
    logNotification('Linking.openSettings() called');
  } catch (error) {
    warnNotification('Linking.openSettings() failed', error);
  }
}

const NOTIFICATION_DEBUG = __DEV__;

let scheduledNotificationId: string | null = null;
let permissionRequested = false;
let handlerConfigured = false;
let responseListenerConfigured = false;
let debugListenersConfigured = false;
let initialResponseHandled = false;

function logNotification(message: string, payload?: unknown): void {
  if (!NOTIFICATION_DEBUG) {
    return;
  }
  if (payload !== undefined) {
    console.log(`[notifications] ${message}`, payload);
  } else {
    console.log(`[notifications] ${message}`);
  }
}

function warnNotification(message: string, payload?: unknown): void {
  if (payload !== undefined) {
    console.warn(`[notifications] ${message}`, payload);
  } else {
    console.warn(`[notifications] ${message}`);
  }
}

async function logScheduledNotifications(context: string): Promise<void> {
  if (!ENABLE_NOTIFICATIONS) {
    return;
  }
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    logNotification(`getAllScheduledNotificationsAsync (${context})`, scheduled);
  } catch (error) {
    warnNotification(
      `getAllScheduledNotificationsAsync failed (${context})`,
      error,
    );
  }
}

async function clearScheduledNotificationsBeforeStart(): Promise<void> {
  if (!ENABLE_NOTIFICATIONS || !__DEV__) {
    return;
  }
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    scheduledNotificationId = null;
    logNotification('cancelAllScheduledNotificationsAsync (dev, before schedule)');
    await logScheduledNotifications('after cancelAll');
  } catch (error) {
    warnNotification('cancelAllScheduledNotificationsAsync failed', error);
  }
}

function configureNotificationHandler(): void {
  if (!ENABLE_NOTIFICATIONS || handlerConfigured) {
    return;
  }
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      logNotification('handleNotification (foreground)', {
        id: notification.request.identifier,
        title: notification.request.content.title,
        body: notification.request.content.body,
        data: notification.request.content.data,
      });
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      };
    },
    handleSuccess: (notificationId) => {
      logNotification('handleSuccess', { notificationId });
    },
    handleError: (notificationId, error) => {
      warnNotification('handleError', { notificationId, error });
    },
  });
}

function configureNotificationResponseListener(): void {
  if (!ENABLE_NOTIFICATIONS || responseListenerConfigured) {
    return;
  }
  responseListenerConfigured = true;

  Notifications.addNotificationResponseReceivedListener((response) => {
    logNotification('addNotificationResponseReceivedListener', {
      actionIdentifier: response.actionIdentifier,
      data: response.notification.request.content.data,
    });
    void handleNotificationResponse(response);
  });
}

function configureDebugListeners(): void {
  if (!NOTIFICATION_DEBUG || !ENABLE_NOTIFICATIONS || debugListenersConfigured) {
    return;
  }
  debugListenersConfigured = true;

  Notifications.addNotificationReceivedListener((notification) => {
    logNotification('addNotificationReceivedListener', {
      id: notification.request.identifier,
      data: notification.request.content.data,
    });
  });
}

export function initializeNotifications(): void {
  if (!ENABLE_NOTIFICATIONS) {
    return;
  }
  configureNotificationHandler();
  configureNotificationResponseListener();
  configureDebugListeners();
}

/** 通知タップでコールドスタートしたとき */
export async function handleInitialNotificationResponse(): Promise<void> {
  if (!ENABLE_NOTIFICATIONS || initialResponseHandled) {
    return;
  }
  try {
    const response = await Notifications.getLastNotificationResponseAsync();
    if (!response) {
      return;
    }
    initialResponseHandled = true;
    logNotification('getLastNotificationResponseAsync', {
      data: response.notification.request.content.data,
    });
    await handleNotificationResponse(response);
  } catch (error) {
    warnNotification('getLastNotificationResponseAsync failed', error);
  }
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!ENABLE_NOTIFICATIONS) {
    return false;
  }
  configureNotificationHandler();

  const current = await Notifications.getPermissionsAsync();
  logNotification('getPermissionsAsync', current);

  if (current.granted) {
    return true;
  }
  if (!permissionRequested) {
    permissionRequested = true;
    const requested = await Notifications.requestPermissionsAsync();
    logNotification('requestPermissionsAsync', requested);
    if (!requested.granted) {
      warnNotification(
        'notifications disabled — enable in system settings',
        requested,
      );
    }
    return requested.granted;
  }

  warnNotification('permission still not granted', current);
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
  const id = scheduledNotificationId;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
    logNotification('cancelScheduledNotificationAsync', { id });
    await logScheduledNotifications('after cancel');
  } catch (error) {
    warnNotification('cancel failed', { id, error });
  } finally {
    scheduledNotificationId = null;
  }
}

export async function scheduleTimerNotification(
  taskId: string,
  seconds: number,
): Promise<boolean> {
  if (!ENABLE_NOTIFICATIONS) {
    return false;
  }

  const userEnabled = await isNotificationUserEnabled();
  if (!userEnabled) {
    logNotification('schedule skipped: user disabled notifications in settings');
    return false;
  }

  const delaySeconds = Math.max(1, Math.ceil(seconds));
  if (delaySeconds <= 0) {
    return false;
  }

  try {
    await clearScheduledNotificationsBeforeStart();
    await cancelTimerNotification();

    const granted = await ensureNotificationPermission();
    if (!granted) {
      warnNotification('schedule skipped: notifications off');
      return false;
    }

    const data = buildTimerNotificationData(taskId);

    logNotification('scheduleNotificationAsync request', {
      delaySeconds,
      data,
    });

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Eskeri',
        body: '終了',
        sound: true,
        data,
      },
      trigger: {
        seconds: delaySeconds,
      },
    });

    scheduledNotificationId = id;
    logNotification('scheduleNotificationAsync result', { id, delaySeconds, data });
    await logScheduledNotifications('after schedule');
    return true;
  } catch (error) {
    warnNotification('schedule failed', error);
    scheduledNotificationId = null;
    return false;
  }
}

export async function dumpNotificationDebugState(): Promise<void> {
  if (!ENABLE_NOTIFICATIONS) {
    warnNotification('notifications disabled (ENABLE_NOTIFICATIONS=false)');
    return;
  }
  configureNotificationHandler();
  logNotification('--- dump start ---');
  try {
    const snapshot = await getNotificationPermissionSnapshot();
    logNotification('permission snapshot', snapshot);
    const current = await Notifications.getPermissionsAsync();
    logNotification('getPermissionsAsync', current);
    if (!current.granted) {
      const requested = await Notifications.requestPermissionsAsync();
      logNotification('requestPermissionsAsync (dump)', requested);
    }
  } catch (error) {
    warnNotification('permission dump failed', error);
  }
  logNotification('scheduledNotificationId (in-memory)', scheduledNotificationId);
  await logScheduledNotifications('dump');
  logNotification('--- dump end ---');
}

export const NOTIFICATION_VERIFICATION_SCENARIOS = [
  {
    id: 'foreground',
    label: '① アプリ前面',
    hint: 'タイマー画面のまま待つ。タップで完了画面（取り組めた/終わる）へ。',
  },
  {
    id: 'background',
    label: '② バックグラウンド',
    hint: 'ホームへ戻して通知をタップ。完了画面へ遷移するか確認。',
  },
  {
    id: 'task-kill',
    label: '③ タスクキル',
    hint: 'アプリ終了後に通知タップ。起動して完了画面へ遷移するか確認。',
  },
  {
    id: 'screen-lock',
    label: '④ 画面ロック',
    hint: 'Preview Build でロック画面から通知タップ。完了画面へ遷移するか確認。',
  },
] as const;
