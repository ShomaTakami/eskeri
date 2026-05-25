import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { INITIAL_TIMER_SECONDS, getTimerBuildMode } from '../../actionStart/constants/timer';
import {
  dumpNotificationDebugState,
  NOTIFICATION_VERIFICATION_SCENARIOS,
  openNotificationSettings,
} from '../../actionStart/services/timerNotifications';
import { useActionStart } from '../../actionStart/hooks/ActionStartContext';
import { useMomentum } from '../../momentum/hooks/MomentumContext';
import {
  debugClearAllData,
  debugResetOnboarding,
} from '../../../shared/debug/clearAppData';
import { NotificationDebugPanel } from './NotificationDebugPanel';

type DebugAction = {
  label: string;
  message: string;
  run: () => Promise<void>;
};

export function DebugSection() {
  const { clearLogs, refresh: refreshLogs } = useActionStart();
  const { resetPoints, refresh: refreshMomentum } = useMomentum();

  const devActions: DebugAction[] = [
    {
      label: 'Onboarding初期化',
      message:
        'オンボーディングを初期化しました。アプリをリロードすると再度表示されます。',
      run: debugResetOnboarding,
    },
    {
      label: '履歴削除',
      message: '履歴を削除しました。',
      run: async () => {
        await clearLogs();
      },
    },
    {
      label: 'Point初期化',
      message: 'ポイントを0にリセットしました。',
      run: async () => {
        await resetPoints();
      },
    },
    {
      label: '全データ削除',
      message: 'すべてのデータを削除しました。アプリをリロードしてください。',
      run: async () => {
        await debugClearAllData();
        await refreshLogs();
        await refreshMomentum();
      },
    },
    {
      label: '通知デバッグをログ出力',
      message:
        'Logcat に [notifications] ログを出力しました。予約一覧と権限を確認してください。',
      run: dumpNotificationDebugState,
    },
    {
      label: '通知の設定を開く',
      message: '端末の エスケリ 設定画面を開きました。通知をオンにしてください。',
      run: openNotificationSettings,
    },
  ];

  const handlePress = (action: DebugAction) => {
    Alert.alert(action.label, '実行しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '実行',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await action.run();
              Alert.alert('完了', action.message);
            } catch (error) {
              console.error(`[Debug] ${action.label} failed`, error);
              Alert.alert(
                'エラー',
                `${action.label}に失敗しました。コンソールを確認してください。`,
              );
            }
          })();
        },
      },
    ]);
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>Debug</Text>
      <NotificationDebugPanel />
      <View style={styles.notificationBlock}>
        <Text style={styles.notificationTitle}>通知検証チェックリスト</Text>
        <Text style={styles.notificationMeta}>
          初回タイマー: {INITIAL_TIMER_SECONDS} 秒（mode: {getTimerBuildMode()}）
        </Text>
        <Text style={styles.notificationMeta}>
          granted:false のとき → 設定 → アプリ → エスケリ → 通知をオン（Android では expo-notifications 0.16.x は権限ダイアログを出さないため、端末設定から有効化が必要）
        </Text>
        {NOTIFICATION_VERIFICATION_SCENARIOS.map((scenario) => (
          <View key={scenario.id} style={styles.scenarioRow}>
            <Text style={styles.scenarioLabel}>{scenario.label}</Text>
            <Text style={styles.scenarioHint}>{scenario.hint}</Text>
          </View>
        ))}
      </View>
      {__DEV__ ? (
        <View style={styles.actions}>
          {devActions.map((action) => (
            <Pressable
              key={action.label}
              style={({ pressed }) => [styles.button, pressed && styles.pressed]}
              onPress={() => handlePress(action)}
            >
              <Text style={styles.buttonLabel}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 40,
    paddingTop: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  notificationBlock: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    gap: 8,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  notificationMeta: {
    fontSize: 12,
    color: '#6b7280',
  },
  scenarioRow: {
    gap: 2,
  },
  scenarioLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  scenarioHint: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 17,
  },
  actions: {
    gap: 10,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fff5f5',
  },
  pressed: {
    opacity: 0.88,
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#b91c1c',
  },
});
