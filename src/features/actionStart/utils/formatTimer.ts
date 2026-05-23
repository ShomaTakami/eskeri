export function formatTimer(seconds: number): string {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/** 最初の5分 — ここまで始められれば成功 */
export const INITIAL_TIMER_SECONDS = 5 * 60;

/** 追加タイマー（分） */
export const EXTENSION_MINUTES = [5, 10, 15, 30] as const;

export type ExtensionMinutes = (typeof EXTENSION_MINUTES)[number];

export function minutesToSeconds(minutes: number): number {
  return minutes * 60;
}
