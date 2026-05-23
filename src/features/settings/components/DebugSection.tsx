import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { useActionStart } from '../../actionStart/hooks/ActionStartContext';
import { useMomentum } from '../../momentum/hooks/MomentumContext';
import {
  debugClearAllData,
  debugResetOnboarding,
} from '../../../shared/debug/clearAppData';

type DebugAction = {
  label: string;
  message: string;
  run: () => Promise<void>;
};

export function DebugSection() {
  const { clearLogs, refresh: refreshLogs } = useActionStart();
  const { resetPoints, refresh: refreshMomentum } = useMomentum();

  if (!__DEV__) {
    return null;
  }

  const actions: DebugAction[] = [
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
  ];

  const handlePress = (action: DebugAction) => {
    Alert.alert(action.label, '実行しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '実行',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await action.run();
            Alert.alert('完了', action.message);
          })();
        },
      },
    ]);
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>Debug</Text>
      <View style={styles.actions}>
        {actions.map((action) => (
          <Pressable
            key={action.label}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
            onPress={() => handlePress(action)}
          >
            <Text style={styles.buttonLabel}>{action.label}</Text>
          </Pressable>
        ))}
      </View>
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
