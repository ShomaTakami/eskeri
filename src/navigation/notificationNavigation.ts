import {
  CommonActions,
  createNavigationContainerRef,
  type NavigationContainerRefWithCurrent,
} from '@react-navigation/native';

import { parseTimerNotificationData } from '../features/actionStart/constants/notificationScreens';
import { getActiveTaskSession } from '../features/actionStart/storage/activeTaskSession';
import type { RootTabParamList } from './types';

type RootNavigationParamList = RootTabParamList;

export const navigationRef =
  createNavigationContainerRef<RootNavigationParamList>() as NavigationContainerRefWithCurrent<RootNavigationParamList>;

let pendingTaskId: string | null = null;
let lastHandledResponseKey: string | null = null;

function logNavigation(message: string, payload?: unknown): void {
  if (!__DEV__) {
    return;
  }
  if (payload !== undefined) {
    console.log(`[notification-nav] ${message}`, payload);
  } else {
    console.log(`[notification-nav] ${message}`);
  }
}

export function navigateToTaskComplete(taskId: string): void {
  if (!navigationRef.isReady()) {
    pendingTaskId = taskId;
    logNavigation('navigation not ready — queued taskId', { taskId });
    return;
  }

  navigationRef.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [
        {
          name: 'HomeTab',
          state: {
            index: 1,
            routes: [
              { name: 'HomeScreen' },
              { name: 'TaskComplete', params: { taskId } },
            ],
          },
        },
      ],
    }),
  );
  logNavigation('navigateToTaskComplete', { taskId });
}

export function flushPendingNotificationNavigation(): void {
  if (!pendingTaskId || !navigationRef.isReady()) {
    return;
  }
  const taskId = pendingTaskId;
  pendingTaskId = null;
  navigateToTaskComplete(taskId);
}

export async function handleNotificationResponse(
  response: {
    actionIdentifier: string;
    notification: { request: { identifier: string; content: { data?: Record<string, unknown> } } };
  },
): Promise<void> {
  const responseKey = `${response.notification.request.identifier}:${response.actionIdentifier}`;
  if (responseKey === lastHandledResponseKey) {
    return;
  }
  lastHandledResponseKey = responseKey;

  const payload = parseTimerNotificationData(
    response.notification.request.content.data,
  );
  if (!payload) {
    return;
  }

  const session = await getActiveTaskSession(payload.taskId);
  if (!session) {
    logNavigation('session not found for taskId', { taskId: payload.taskId });
    return;
  }

  navigateToTaskComplete(payload.taskId);
}

export function onNavigationContainerReady(): void {
  flushPendingNotificationNavigation();
}
