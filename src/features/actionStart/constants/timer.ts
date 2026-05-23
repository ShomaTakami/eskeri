/** 本番の初回タイマー長（5分） */
export const PRODUCTION_INITIAL_TIMER_SECONDS = 5 * 60;

/** 検証用の初回タイマー長（1分）— __DEV__ のみ */
export const DEV_INITIAL_TIMER_SECONDS = 60;

/**
 * 初回タイマー長（秒）。
 * 検証時は __DEV__ で 1 分、本番ビルドでは 5 分。
 */
export const INITIAL_TIMER_SECONDS = __DEV__
  ? DEV_INITIAL_TIMER_SECONDS
  : PRODUCTION_INITIAL_TIMER_SECONDS;
