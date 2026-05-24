/**
 * 画面ロック中は JS タイマーが止まるため、終了時刻 endAt を基準に残り秒を再計算する。
 * Preview Build 等でロック復帰時の表示ズレを防ぐ。
 */
export type TimerClock = {
  /** 現在のランニング区間の開始時刻（epoch ms） */
  segmentStartedAtMs: number;
  /** 終了予定時刻（epoch ms）— 復帰時は Date.now() との差分で残り秒を出す */
  endAtMs: number;
};

export function createTimerClock(durationSeconds: number): TimerClock {
  const segmentStartedAtMs = Date.now();
  const normalizedSeconds = Number.isFinite(durationSeconds)
    ? Math.max(0, durationSeconds)
    : 0;
  return {
    segmentStartedAtMs,
    endAtMs: segmentStartedAtMs + normalizedSeconds * 1000,
  };
}

/** endAt - Date.now() から残り秒（ロック復帰後の再計算） */
export function remainingSecondsFromEndAt(endAtMs: number): number {
  return Math.max(0, Math.ceil((endAtMs - Date.now()) / 1000));
}

export function remainingSecondsFromTimerClock(clock: TimerClock): number {
  return remainingSecondsFromEndAt(clock.endAtMs);
}
