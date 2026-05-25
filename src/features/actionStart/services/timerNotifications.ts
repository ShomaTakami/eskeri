/**
 * ローカル通知のみ（Push / Expo Push Token は使用しない）。
 * SDK 46 / expo-notifications@0.16
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';

import { STORAGE_KEYS } from '../../../shared/constants/storageKeys';
import {
  buildTimerNotificationData,
  parseTimerNotificationData,
} from '../constants/notificationScreens';
import {
  isNotificationUserEnabled,
} from '../../settings/storage/notificationPreferences';
import {
  handleNotificationResponse,
} from '../../../navigation/notificationNavigation';

export const ENABLE_NOTIFICATIONS = true;
export const DEFAULT_NOTIFICATION_CHANNEL_ID = 'default';

export type NotificationPermissionSnapshot = {
  granted: boolean;
  status: string;
  canAskAgain: boolean;
  needsSettings: boolean;
};

export type NotificationDebugSnapshot = {
  permission: NotificationPermissionSnapshot | null;
  channelConfigured: boolean;
  channels: {
    id: string;
    name: string | null;
    importance: number;
  }[];
  lastScheduledNotificationId: string | null;
  persistedNotification: {
    taskId: string;
    notificationId: string;
  } | null;
  scheduledNotifications: {
    id: string;
    title: string | null;
    body: string | null;
    channelId: string | null;
    trigger: unknown;
  }[];
  lastError: string | null;
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
    recordNotificationError('Linking.openSettings() failed', error);
  }
}

const NOTIFICATION_VERBOSE_DEBUG = __DEV__;

let scheduledNotificationId: string | null = null;
let channelConfigured = false;
let lastNotificationError: string | null = null;
let cachedDebugSnapshot: NotificationDebugSnapshot | null = null;
let scheduleOperation: Promise<unknown> = Promise.resolve();

function enqueueScheduleOperation<T>(operation: () => Promise<T>): Promise<T> {
  const next = scheduleOperation.then(operation, operation);
  scheduleOperation = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

type PersistedTimerNotification = {
  taskId: string;
  notificationId: string;
};

function recordNotificationError(context: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  lastNotificationError = `${context}: ${message}`;
  warnNotification(context, error);
}

function logNotification(message: string, payload?: unknown): void {
  if (payload !== undefined) {
    console.warn(`[notifications] ${message}`, payload);
  } else {
    console.warn(`[notifications] ${message}`);
  }
}

function logNotificationVerbose(message: string, payload?: unknown): void {
  if (!NOTIFICATION_VERBOSE_DEBUG) {
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

async function getPersistedTimerNotification(): Promise<PersistedTimerNotification | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.scheduledTimerNotification);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as PersistedTimerNotification;
    if (
      typeof parsed.taskId === 'string' &&
      parsed.taskId.length > 0 &&
      typeof parsed.notificationId === 'string' &&
      parsed.notificationId.length > 0
    ) {
      return parsed;
    }
  } catch (error) {
    recordNotificationError('getPersistedTimerNotification failed', error);
  }
  return null;
}

async function setPersistedTimerNotification(
  taskId: string,
  notificationId: string,
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.scheduledTimerNotification,
      JSON.stringify({ taskId, notificationId }),
    );
  } catch (error) {
    recordNotificationError('setPersistedTimerNotification failed', error);
  }
}

async function clearPersistedTimerNotification(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.scheduledTimerNotification);
  } catch (error) {
    recordNotificationError('clearPersistedTimerNotification failed', error);
  }
}

function extractChannelIdFromTrigger(trigger: unknown): string | null {
  if (!trigger || typeof trigger !== 'object') {
    return null;
  }
  const channelId = (trigger as { channelId?: unknown }).channelId;
  return typeof channelId === 'string' ? channelId : null;
}

async function readNotificationChannels(): Promise<NotificationDebugSnapshot['channels']> {
  if (Platform.OS !== 'android') {
    return [];
  }
  try {
    const channels = await Notifications.getNotificationChannelsAsync();
    logNotification('getNotificationChannelsAsync', channels);
    return channels.map((channel) => ({
      id: channel.id,
      name: channel.name,
      importance: channel.importance,
    }));
  } catch (error) {
    recordNotificationError('getNotificationChannelsAsync failed', error);
    return [];
  }
}

async function readScheduledNotifications(): Promise<
  NotificationDebugSnapshot['scheduledNotifications']
> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    logNotification('getAllScheduledNotificationsAsync', scheduled);
    return scheduled.map((request) => ({
      id: request.identifier,
      title: request.content.title,
      body: request.content.body,
      channelId: extractChannelIdFromTrigger(request.trigger),
      trigger: request.trigger,
    }));
  } catch (error) {
    recordNotificationError('getAllScheduledNotificationsAsync failed', error);
    return [];
  }
}

export async function ensureAndroidNotificationChannel(): Promise<void> {
  if (!ENABLE_NOTIFICATIONS || Platform.OS !== 'android') {
    return;
  }
  if (channelConfigured) {
    return;
  }

  try {
    const channel = await Notifications.setNotificationChannelAsync(
      DEFAULT_NOTIFICATION_CHANNEL_ID,
      {
        name: 'タイマー通知',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'default',
        enableVibrate: true,
        vibrationPattern: [0, 250, 250, 250],
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: false,
        showBadge: true,
      },
    );
    channelConfigured = true;
    logNotification('setNotificationChannelAsync', {
      channelId: DEFAULT_NOTIFICATION_CHANNEL_ID,
      channel,
    });
    await readNotificationChannels();
  } catch (error) {
    recordNotificationError('setNotificationChannelAsync failed', error);
  }
}

export async function getNotificationDebugSnapshot(): Promise<NotificationDebugSnapshot> {
  if (cachedDebugSnapshot) {
    return cachedDebugSnapshot;
  }

  let permission: NotificationPermissionSnapshot | null = null;
  try {
    permission = await getNotificationPermissionSnapshot();
  } catch (error) {
    recordNotificationError('getNotificationDebugSnapshot permission failed', error);
  }

  cachedDebugSnapshot = {
    permission,
    channelConfigured,
    channels: await readNotificationChannels(),
    lastScheduledNotificationId: scheduledNotificationId,
    persistedNotification: await getPersistedTimerNotification(),
    scheduledNotifications: await readScheduledNotifications(),
    lastError: lastNotificationError,
  };
  return cachedDebugSnapshot;
}

export async function refreshNotificationDebugState(): Promise<NotificationDebugSnapshot> {
  cachedDebugSnapshot = null;
  return getNotificationDebugSnapshot();
}

async function cancelScheduledNotificationById(id: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
    logNotification('cancelScheduledNotificationAsync', { id });
  } catch (error) {
    recordNotificationError('cancelScheduledNotificationAsync failed', error);
  }
}

async function cancelTimerNotificationsForTask(taskId: string): Promise<void> {
  const idsToCancel = new Set<string>();

  if (scheduledNotificationId) {
    idsToCancel.add(scheduledNotificationId);
  }

  const persisted = await getPersistedTimerNotification();
  if (persisted?.taskId === taskId) {
    idsToCancel.add(persisted.notificationId);
  }

  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const request of scheduled) {
      const data = parseTimerNotificationData(
        request.content.data as Record<string, unknown> | undefined,
      );
      if (data?.taskId === taskId) {
        idsToCancel.add(request.identifier);
      }
    }
  } catch (error) {
    recordNotificationError('getAllScheduledNotificationsAsync failed (cancel by taskId)', error);
  }

  await Promise.all([...idsToCancel].map((id) => cancelScheduledNotificationById(id)));
  scheduledNotificationId = null;
  await clearPersistedTimerNotification();
  cachedDebugSnapshot = null;
}

let permissionRequested = false;
let handlerConfigured = false;
let responseListenerConfigured = false;
let debugListenersConfigured = false;
let initialResponseHandled = false;

async function logScheduledNotifications(context: string): Promise<void> {
  if (!ENABLE_NOTIFICATIONS) {
    return;
  }
  await readScheduledNotifications();
  logNotificationVerbose(`scheduled notifications (${context})`);
}

async function clearScheduledNotificationsBeforeStart(): Promise<void> {
  if (!ENABLE_NOTIFICATIONS || !__DEV__) {
    return;
  }
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    scheduledNotificationId = null;
    logNotificationVerbose('cancelAllScheduledNotificationsAsync (dev, before schedule)');
    await logScheduledNotifications('after cancelAll');
  } catch (error) {
    recordNotificationError('cancelAllScheduledNotificationsAsync failed', error);
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
        priority: Notifications.AndroidNotificationPriority.MAX,
      };
    },
    handleSuccess: (notificationId) => {
      logNotificationVerbose('handleSuccess', { notificationId });
    },
    handleError: (notificationId, error) => {
      recordNotificationError(`handleError (${notificationId})`, error);
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
  if (!NOTIFICATION_VERBOSE_DEBUG || !ENABLE_NOTIFICATIONS || debugListenersConfigured) {
    return;
  }
  debugListenersConfigured = true;

  Notifications.addNotificationReceivedListener((notification) => {
    logNotificationVerbose('addNotificationReceivedListener', {
      id: notification.request.identifier,
      data: notification.request.content.data,
    });
  });
}

export async function initializeNotifications(): Promise<void> {
  if (!ENABLE_NOTIFICATIONS) {
    return;
  }
  configureNotificationHandler();
  configureNotificationResponseListener();
  configureDebugListeners();
  await ensureAndroidNotificationChannel();
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
    recordNotificationError('getLastNotificationResponseAsync failed', error);
  }
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!ENABLE_NOTIFICATIONS) {
    return false;
  }
  configureNotificationHandler();
  await ensureAndroidNotificationChannel();

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

export async function cancelTimerNotification(taskId?: string): Promise<void> {
  if (!ENABLE_NOTIFICATIONS) {
    scheduledNotificationId = null;
    await clearPersistedTimerNotification();
    cachedDebugSnapshot = null;
    return;
  }
  if (taskId) {
    await cancelTimerNotificationsForTask(taskId);
    return;
  }
  if (!scheduledNotificationId) {
    const persisted = await getPersistedTimerNotification();
    if (persisted) {
      await cancelTimerNotificationsForTask(persisted.taskId);
    }
    return;
  }
  await cancelScheduledNotificationById(scheduledNotificationId);
  scheduledNotificationId = null;
  await clearPersistedTimerNotification();
  cachedDebugSnapshot = null;
  await logScheduledNotifications('after cancel');
}

function buildTimerNotificationContent(options: {
  actionTitle?: string;
  isExtension?: boolean;
}): { title: string; body: string } {
  const actionTitle = options.actionTitle?.trim() || 'アクション';
  if (options.isExtension) {
    return {
      title: '追加時間が終わりました',
      body: `「${actionTitle}」を終えて、記録しましょう。タップで完了画面へ`,
    };
  }
  return {
    title: 'タイマーが終わりました',
    body: `「${actionTitle}」の時間です。タップして次へ進みましょう`,
  };
}

async function scheduleTimerNotificationInternal(
  taskId: string,
  endAtMs: number,
  options?: {
    actionTitle?: string;
    isExtension?: boolean;
  },
): Promise<boolean> {
  if (!ENABLE_NOTIFICATIONS) {
    return false;
  }

  const userEnabled = await isNotificationUserEnabled();
  if (!userEnabled) {
    logNotification('schedule skipped: user disabled notifications in settings');
    return false;
  }

  const delayMs = endAtMs - Date.now();
  if (delayMs <= 0) {
    logNotification('schedule skipped: endAtMs is in the past', {
      endAtMs,
      now: Date.now(),
    });
    return false;
  }

  const delaySeconds = Math.max(1, Math.ceil(delayMs / 1000));

  try {
    await clearScheduledNotificationsBeforeStart();
    await cancelTimerNotificationsForTask(taskId);
    await ensureAndroidNotificationChannel();

    const granted = await ensureNotificationPermission();
    if (!granted) {
      warnNotification('schedule skipped: notifications off');
      return false;
    }

    const data = buildTimerNotificationData(taskId);
    const { title: notificationTitle, body: notificationBody } =
      buildTimerNotificationContent({
        actionTitle: options?.actionTitle,
        isExtension: options?.isExtension,
      });
    const triggerDate = new Date(endAtMs);

    logNotification('scheduleNotificationAsync request', {
      endAtMs,
      triggerDate: triggerDate.toISOString(),
      delaySeconds,
      channelId: DEFAULT_NOTIFICATION_CHANNEL_ID,
      notificationTitle,
      notificationBody,
      isExtension: options?.isExtension ?? false,
      data,
    });

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: notificationTitle,
        body: notificationBody,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
        data,
      },
      trigger: {
        date: triggerDate,
        channelId: DEFAULT_NOTIFICATION_CHANNEL_ID,
      },
    });

    scheduledNotificationId = id;
    await setPersistedTimerNotification(taskId, id);
    cachedDebugSnapshot = null;
    logNotification('scheduleNotificationAsync result', {
      id,
      endAtMs,
      triggerDate: triggerDate.toISOString(),
      delaySeconds,
      channelId: DEFAULT_NOTIFICATION_CHANNEL_ID,
      data,
    });
    await logScheduledNotifications('after schedule');
    return true;
  } catch (error) {
    recordNotificationError('schedule failed', error);
    scheduledNotificationId = null;
    await clearPersistedTimerNotification();
    cachedDebugSnapshot = null;
    return false;
  }
}

export async function scheduleTimerNotification(
  taskId: string,
  endAtMs: number,
  options?: {
    actionTitle?: string;
    isExtension?: boolean;
  },
): Promise<boolean> {
  return enqueueScheduleOperation(() =>
    scheduleTimerNotificationInternal(taskId, endAtMs, options),
  );
}

export async function dumpNotificationDebugState(): Promise<void> {
  if (!ENABLE_NOTIFICATIONS) {
    warnNotification('notifications disabled (ENABLE_NOTIFICATIONS=false)');
    return;
  }
  await initializeNotifications();
  logNotification('--- dump start ---');
  try {
    const snapshot = await refreshNotificationDebugState();
    logNotification('permission snapshot', snapshot.permission);
    const current = await Notifications.getPermissionsAsync();
    logNotification('getPermissionsAsync (dump)', current);
    if (!current.granted) {
      const requested = await Notifications.requestPermissionsAsync();
      logNotification('requestPermissionsAsync (dump)', requested);
    }
  } catch (error) {
    recordNotificationError('permission dump failed', error);
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
