import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEYS } from '../../../shared/constants/storageKeys';
import type { ActionLog } from '../types/actionLog';
import { isScaleValue } from '../utils/scale';

function normalizeFeelingAfter(value: unknown): number | null {
  if (isScaleValue(value)) {
    return value;
  }
  if (value === 'light') {
    return 1;
  }
  if (value === 'normal') {
    return 3;
  }
  if (value === 'heavy') {
    return 5;
  }
  return null;
}

function normalizeLog(raw: unknown): ActionLog | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const item = raw as Partial<ActionLog> & { feelingAfter?: unknown };
  if (
    typeof item.id !== 'string' ||
    typeof item.title !== 'string' ||
    typeof item.startedAt !== 'string' ||
    typeof item.duration !== 'number'
  ) {
    return null;
  }
  const heavinessBefore = isScaleValue(item.heavinessBefore)
    ? item.heavinessBefore
    : null;
  const feelingAfter = normalizeFeelingAfter(item.feelingAfter);
  if (heavinessBefore === null || feelingAfter === null) {
    return null;
  }
  return {
    id: item.id,
    title: item.title,
    startedAt: item.startedAt,
    duration: item.duration,
    heavinessBefore,
    feelingAfter,
    ...(item.momentumAwarded === true ? { momentumAwarded: true } : {}),
  };
}

export async function loadActionLogs(): Promise<ActionLog[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.actionLogs);
  if (!raw) {
    return [];
  }
  const parsed = JSON.parse(raw) as unknown[];
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed
    .map(normalizeLog)
    .filter((log): log is ActionLog => log !== null);
}

export async function saveActionLogs(logs: ActionLog[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.actionLogs, JSON.stringify(logs));
}

export async function clearActionLogs(): Promise<void> {
  await saveActionLogs([]);
}

export async function appendActionLog(log: ActionLog): Promise<ActionLog[]> {
  const current = await loadActionLogs();
  const next = [log, ...current];
  await saveActionLogs(next);
  return next;
}
