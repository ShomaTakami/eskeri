import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  getNotificationDebugSnapshot,
  refreshNotificationDebugState,
  type NotificationDebugSnapshot,
} from '../../actionStart/services/timerNotifications';
import { ACCENT } from '../../../shared/theme/colors';

function formatSnapshot(snapshot: NotificationDebugSnapshot): string {
  return JSON.stringify(
    {
      permission: snapshot.permission,
      channelConfigured: snapshot.channelConfigured,
      channels: snapshot.channels,
      lastScheduledNotificationId: snapshot.lastScheduledNotificationId,
      persistedNotification: snapshot.persistedNotification,
      scheduledNotifications: snapshot.scheduledNotifications,
      lastError: snapshot.lastError,
    },
    null,
    2,
  );
}

export function NotificationDebugPanel() {
  const [snapshot, setSnapshot] = useState<NotificationDebugSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setRefreshError(null);
    try {
      await refreshNotificationDebugState();
      setSnapshot(await getNotificationDebugSnapshot());
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setRefreshError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return (
    <View style={styles.block}>
      <Text style={styles.title}>通知デバッグ（Preview / Logcat 確認用）</Text>
      <Text style={styles.meta}>
        adb logcat で [notifications] を検索。バックグラウンド・画面ロック時の表示確認に使います。
      </Text>

      {loading ? (
        <ActivityIndicator size="small" color={ACCENT} style={styles.loader} />
      ) : null}

      {refreshError ? (
        <Text style={styles.error}>更新失敗: {refreshError}</Text>
      ) : null}

      {snapshot ? (
        <>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>権限</Text>
            <Text style={styles.summaryValue}>
              {snapshot.permission?.granted ? 'granted' : snapshot.permission?.status ?? 'unknown'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>チャンネル作成済み</Text>
            <Text style={styles.summaryValue}>
              {snapshot.channelConfigured ? 'yes' : 'no'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>最後の予約 ID</Text>
            <Text style={styles.summaryValue} selectable>
              {snapshot.lastScheduledNotificationId ?? '(なし)'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>予約件数</Text>
            <Text style={styles.summaryValue}>
              {snapshot.scheduledNotifications.length}
            </Text>
          </View>
          {snapshot.lastError ? (
            <Text style={styles.error}>最後のエラー: {snapshot.lastError}</Text>
          ) : null}
          <Text style={styles.rawLabel}>詳細（JSON）</Text>
          <Text style={styles.raw} selectable>
            {formatSnapshot(snapshot)}
          </Text>
        </>
      ) : null}

      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        onPress={() => {
          void refresh();
        }}
      >
        <Text style={styles.buttonLabel}>状態を更新</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  meta: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 17,
  },
  loader: {
    alignSelf: 'flex-start',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  summaryValue: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'right',
  },
  error: {
    fontSize: 12,
    color: '#b91c1c',
    lineHeight: 17,
  },
  rawLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginTop: 4,
  },
  raw: {
    fontSize: 10,
    color: '#374151',
    fontFamily: 'monospace',
    lineHeight: 14,
  },
  button: {
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.88,
  },
  buttonLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
});
