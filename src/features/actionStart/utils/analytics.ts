import type { ActionLog } from '../types/actionLog';
import { isToday } from './dates';

export type TimeOfDaySlotId =
  | 'morning'
  | 'noon'
  | 'evening'
  | 'night'
  | 'lateNight';

export type TimeOfDaySlot = {
  id: TimeOfDaySlotId;
  label: string;
  count: number;
};

const TIME_SLOTS: { id: TimeOfDaySlotId; label: string; match: (hour: number) => boolean }[] = [
  { id: 'morning', label: '朝', match: (h) => h >= 5 && h < 12 },
  { id: 'noon', label: '昼', match: (h) => h >= 12 && h < 17 },
  { id: 'evening', label: '夕方', match: (h) => h >= 17 && h < 19 },
  { id: 'night', label: '夜', match: (h) => h >= 19 && h < 23 },
  { id: 'lateNight', label: '深夜', match: (h) => h >= 23 || h < 5 },
];

function isThisWeek(isoDate: string): boolean {
  const date = new Date(isoDate);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);
  const day = startOfWeek.getDay();
  const mondayOffset = day === 0 ? 6 : day - 1;
  startOfWeek.setDate(startOfWeek.getDate() - mondayOffset);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  return date >= startOfWeek && date < endOfWeek;
}

export type ActionStats = {
  todayCount: number;
  weekCount: number;
  timeOfDaySlots: TimeOfDaySlot[];
};

export function computeActionStats(logs: ActionLog[]): ActionStats {
  const todayCount = logs.filter((log) => isToday(log.startedAt)).length;
  const weekCount = logs.filter((log) => isThisWeek(log.startedAt)).length;

  const slotCounts = new Map<TimeOfDaySlotId, number>();
  for (const slot of TIME_SLOTS) {
    slotCounts.set(slot.id, 0);
  }

  for (const log of logs) {
    const hour = new Date(log.startedAt).getHours();
    const slot = TIME_SLOTS.find((s) => s.match(hour));
    if (slot) {
      slotCounts.set(slot.id, (slotCounts.get(slot.id) ?? 0) + 1);
    }
  }

  const timeOfDaySlots = TIME_SLOTS.map((slot) => ({
    id: slot.id,
    label: slot.label,
    count: slotCounts.get(slot.id) ?? 0,
  }));

  return { todayCount, weekCount, timeOfDaySlots };
}
