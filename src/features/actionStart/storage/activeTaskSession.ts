import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEYS } from '../../../shared/constants/storageKeys';

export type ActiveTaskPhase =
  | 'running'
  | 'startCheckpoint'
  | 'checkpoint'
  | 'feeling';

export type ActiveTaskSession = {
  taskId: string;
  title: string;
  startedAt: string;
  heavinessBefore: number;
  onExtension: boolean;
  momentumAwarded: boolean;
  phase: ActiveTaskPhase;
  segmentStartedAtMs: number;
  endAtMs: number;
  totalSeconds: number;
};

export async function getActiveTaskSession(
  taskId: string,
): Promise<ActiveTaskSession | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.activeTaskSession);
  if (!raw) {
    return null;
  }
  try {
    const session = JSON.parse(raw) as ActiveTaskSession;
    if (session.taskId !== taskId) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export async function getCurrentActiveTaskSession(): Promise<ActiveTaskSession | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.activeTaskSession);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as ActiveTaskSession;
  } catch {
    return null;
  }
}

export async function saveActiveTaskSession(
  session: ActiveTaskSession,
): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEYS.activeTaskSession,
    JSON.stringify(session),
  );
}

export async function updateActiveTaskSession(
  taskId: string,
  patch: Partial<ActiveTaskSession>,
): Promise<ActiveTaskSession | null> {
  const current = await getActiveTaskSession(taskId);
  if (!current) {
    return null;
  }
  const next = { ...current, ...patch, taskId };
  await saveActiveTaskSession(next);
  return next;
}

export async function clearActiveTaskSession(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.activeTaskSession);
}

/** タイマー終了後の完了操作フェーズへ（通知タップ・自然終了） */
export function resolvePhaseAfterTimerEnd(
  session: ActiveTaskSession,
): ActiveTaskPhase {
  if (session.phase !== 'running') {
    return session.phase;
  }
  if (Date.now() < session.endAtMs) {
    return 'running';
  }
  return session.onExtension ? 'checkpoint' : 'startCheckpoint';
}
