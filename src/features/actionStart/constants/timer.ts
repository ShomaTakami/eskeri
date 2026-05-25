import Constants from 'expo-constants';

/** 本番の初回タイマー長（5分） */
export const PRODUCTION_INITIAL_TIMER_SECONDS = 5 * 60;

/** 検証用の初回タイマー長（1分）— __DEV__ のみ */
export const DEV_INITIAL_TIMER_SECONDS = 60;

/** Preview Build 向けの初回タイマー長（10秒）— EAS preview プロファイルのみ */
export const PREVIEW_INITIAL_TIMER_SECONDS = 10;

function readPreviewShortTimerFlag(): boolean {
  const extra =
    Constants.expoConfig?.extra ??
    (Constants.manifest as { extra?: Record<string, unknown> } | null)?.extra;
  return extra?.previewShortTimer === true;
}

const USE_PREVIEW_SHORT_TIMER = readPreviewShortTimerFlag();

export type TimerBuildMode = 'dev' | 'preview' | 'production';

export function getTimerBuildMode(): TimerBuildMode {
  if (__DEV__) {
    return 'dev';
  }
  if (USE_PREVIEW_SHORT_TIMER) {
    return 'preview';
  }
  return 'production';
}

/**
 * 初回タイマー長（秒）。
 * - 開発（__DEV__）: 60 秒
 * - Preview Build（EAS preview プロファイル）: 10 秒
 * - 本番: 300 秒
 */
export const INITIAL_TIMER_SECONDS = __DEV__
  ? DEV_INITIAL_TIMER_SECONDS
  : USE_PREVIEW_SHORT_TIMER
    ? PREVIEW_INITIAL_TIMER_SECONDS
    : PRODUCTION_INITIAL_TIMER_SECONDS;
