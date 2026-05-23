/**
 * ローカル通知のみ（Push / Expo Push Token は使用しない）。
 * SDK 46 / expo-notifications@0.16
 */
import * as Notifications from 'expo-notifications';
import { Linking } from 'react-native';

export const ENABLE_NOTIFICATIONS = true;

/**
 * Android（expo-notifications@0.16）では requestPermissionsAsync が
 * システムダイアログを出さず、通知オン/オフの状態を読むだけ。
 * オフのときは設定アプリから有効化が必要。
 */
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
let debugListenersConfigured = false;

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

/** 検証中（__DEV__）は予約開始前に既存予約をすべてクリア */
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
  logNotification('NotificationHandler configured', {
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
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
      title: notification.request.content.title,
      body: notification.request.content.body,
      trigger: notification.request.trigger,
    });
  });

  Notifications.addNotificationResponseReceivedListener((response) => {
    logNotification('addNotificationResponseReceivedListener', {
      actionIdentifier: response.actionIdentifier,
      id: response.notification.request.identifier,
    });
  });

  logNotification('debug listeners registered');
}

export function initializeNotifications(): void {
  if (!ENABLE_NOTIFICATIONS) {
    return;
  }
  configureNotificationHandler();
  configureDebugListeners();
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
        'notifications disabled — enable in system settings (Android SDK46 does not show a permission dialog)',
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
  seconds: number,
): Promise<boolean> {
  if (!ENABLE_NOTIFICATIONS) {
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
      warnNotification(
        'schedule skipped: notifications off — open Settings → Apps → Eskeri → Notifications',
      );
      return false;
    }

    logNotification('scheduleNotificationAsync request', {
      delaySeconds,
      content: { title: 'Eskeri', body: '終了' },
    });

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Eskeri',
        body: '終了',
        sound: true,
      },
      trigger: {
        seconds: delaySeconds,
      },
    });

    scheduledNotificationId = id;
    logNotification('scheduleNotificationAsync result', { id, delaySeconds });
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
      if (!requested.granted) {
        warnNotification(
          'notifications still off — tap「通知の設定を開く」or enable in system settings',
        );
      }
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
    hint: 'タイマー画面のまま待つ。コンソールに handleNotification / Received が出るか確認。',
  },
  {
    id: 'background',
    label: '② バックグラウンド',
    hint: 'ホームへ戻す（タスクキルはしない）。通知トレイに「終了」が出るか確認。',
  },
  {
    id: 'task-kill',
    label: '③ タスクキル',
    hint: '最近のアプリから Eskeri をスワイプ終了してから待つ。端末によって届かない場合あり。',
  },
  {
    id: 'screen-lock',
    label: '④ 画面ロック',
    hint: '電源ボタンでロックしたまま待つ。ロック画面またはトレイに表示されるか確認。',
  },
] as const;
