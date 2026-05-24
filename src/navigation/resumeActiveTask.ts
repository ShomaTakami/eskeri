import {
  getCurrentActiveTaskSession,
  resolvePhaseAfterTimerEnd,
  updateActiveTaskSession,
  type ActiveTaskSession,
} from '../features/actionStart/storage/activeTaskSession';
import { navigateToTaskComplete, navigationRef } from './notificationNavigation';

function logResume(message: string, payload?: unknown): void {
  if (!__DEV__) {
    return;
  }
  if (payload !== undefined) {
    console.log(`[task-resume] ${message}`, payload);
  } else {
    console.log(`[task-resume] ${message}`);
  }
}

function getHomeStackFocusedRoute(): {
  name: string;
  params?: Record<string, unknown>;
} | null {
  if (!navigationRef.isReady()) {
    return null;
  }
  const root = navigationRef.getRootState();
  const tab = root.routes[root.index ?? 0];
  if (tab?.name !== 'HomeTab' || !tab.state) {
    return null;
  }
  const stack = tab.state;
  const route = stack.routes[stack.index ?? stack.routes.length - 1];
  if (!route) {
    return null;
  }
  return route as { name: string; params?: Record<string, unknown> };
}

/** タイマー終了後の完了操作が未完了か */
export function shouldResumeTaskComplete(
  session: ActiveTaskSession,
): boolean {
  return resolvePhaseAfterTimerEnd(session) !== 'running';
}

function isAlreadyShowingCompletion(session: ActiveTaskSession): boolean {
  const route = getHomeStackFocusedRoute();
  if (!route) {
    return false;
  }
  if (route.params?.taskId !== session.taskId) {
    return false;
  }
  if (route.name === 'TaskComplete') {
    return true;
  }
  if (route.name === 'TimerScreen' && session.phase !== 'running') {
    return true;
  }
  return false;
}

async function syncSessionPhaseIfTimerEnded(
  session: ActiveTaskSession,
): Promise<ActiveTaskSession> {
  if (session.phase !== 'running' || Date.now() < session.endAtMs) {
    return session;
  }
  const nextPhase = session.onExtension ? 'checkpoint' : 'startCheckpoint';
  const updated = await updateActiveTaskSession(session.taskId, {
    phase: nextPhase,
  });
  return updated ?? { ...session, phase: nextPhase };
}

/**
 * 通知タップ以外でアプリを開いたとき、終了済みタスクがあれば完了画面へ。
 */
export async function resumeActiveTaskIfNeeded(): Promise<void> {
  if (!navigationRef.isReady()) {
    return;
  }

  let session = await getCurrentActiveTaskSession();
  if (!session) {
    return;
  }

  session = await syncSessionPhaseIfTimerEnded(session);

  if (!shouldResumeTaskComplete(session)) {
    return;
  }

  if (isAlreadyShowingCompletion(session)) {
    logResume('already showing completion UI', { taskId: session.taskId });
    return;
  }

  logResume('navigate to TaskComplete', { taskId: session.taskId });
  navigateToTaskComplete(session.taskId);
}
