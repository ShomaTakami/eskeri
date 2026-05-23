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
  title: string;
  logs: ActionLog[];
};

function dayLabel(isoDate: string): string {
  if (isToday(isoDate)) {
    return '今日';
  }
  if (isYesterday(isoDate)) {
    return '昨日';
  }
  const date = new Date(isoDate);
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
    const label = dayLabel(log.startedAt);
    const last = sections[sections.length - 1];
    if (last?.title === label) {
      last.logs.push(log);
    } else {
      sections.push({ title: label, logs: [log] });
    }
  }

  return sections;
}
