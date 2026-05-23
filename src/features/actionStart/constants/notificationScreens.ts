/** 終了通知タップ時の遷移先（content.data.screen） */
export const NOTIFICATION_SCREEN_TASK_COMPLETE = 'TaskComplete' as const;

export type TimerNotificationData = {
  taskId: string;
  screen: typeof NOTIFICATION_SCREEN_TASK_COMPLETE;
};

export function buildTimerNotificationData(
  taskId: string,
): TimerNotificationData {
  return {
    taskId,
    screen: NOTIFICATION_SCREEN_TASK_COMPLETE,
  };
}

export function parseTimerNotificationData(
  data: Record<string, unknown> | undefined,
): TimerNotificationData | null {
  if (!data) {
    return null;
  }
  const taskId = data.taskId;
  const screen = data.screen;
  if (
    typeof taskId === 'string' &&
    taskId.length > 0 &&
    screen === NOTIFICATION_SCREEN_TASK_COMPLETE
  ) {
    return { taskId, screen: NOTIFICATION_SCREEN_TASK_COMPLETE };
  }
  return null;
}
