import type { ActionLog } from '../types/actionLog';

export function isToday(isoDate: string): boolean {
  const date = new Date(isoDate);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function isYesterday(isoDate: string): boolean {
  const date = new Date(isoDate);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()
  );
}

export function formatTime(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export type HistorySection = {
  dayKey: string;
  title: string;
  logs: ActionLog[];
};

function dayKey(isoDate: string): string {
  const date = new Date(isoDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dayLabel(isoDate: string): string {
  if (isToday(isoDate)) {
    return '今日';
  }
  if (isYesterday(isoDate)) {
    return '昨日';
  }
  const date = new Date(isoDate);
  const now = new Date();
  if (date.getFullYear() !== now.getFullYear()) {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
  }
  return date.toLocaleDateString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
  });
}

export function groupLogsByDay(logs: ActionLog[]): HistorySection[] {
  const sorted = [...logs].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  );

  const sections: HistorySection[] = [];

  for (const log of sorted) {
    const key = dayKey(log.startedAt);
    const title = dayLabel(log.startedAt);
    const last = sections[sections.length - 1];
    if (last?.dayKey === key) {
      last.logs.push(log);
    } else {
      sections.push({ dayKey: key, title, logs: [log] });
    }
  }

  return sections;
}
