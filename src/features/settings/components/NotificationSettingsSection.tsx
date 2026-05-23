import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  Alert,
  AppState,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import {
  getNotificationPermissionSnapshot,
  openNotificationSettings,
} from '../../actionStart/services/timerNotifications';
import {
  isNotificationUserEnabled,
  setNotificationUserEnabled,
} from '../storage/notificationPreferences';
import { ACCENT } from '../../../shared/theme/colors';

type PermissionState = 'loading' | 'granted' | 'denied';

export function NotificationSettingsSection() {
  const [userEnabled, setUserEnabled] = useState(true);
  const [permissionState, setPermissionState] = useState<PermissionState>('loading');
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(async () => {
    const [enabled, permission] = await Promise.all([
      isNotificationUserEnabled(),
      getNotificationPermissionSnapshot(),
    ]);
    setUserEnabled(enabled);
    setPermissionState(permission.granted ? 'granted' : 'denied');
    setHydrated(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  useFocusEffect(
    useCallback(() => {
      const subscription = AppState.addEventListener('change', (nextState) => {
        if (nextState === 'active') {
          void refresh();
        }
      });
      return () => subscription.remove();
    }, [refresh]),
  );

  const handleToggle = (next: boolean) => {
    if (next && permissionState === 'denied') {
      Alert.alert(
        '端末で通知をオンにしてください',
        'タイマー終了の通知を受け取るには、端末の設定で Eskeri の通知を有効にする必要があります。',
        [
          { text: 'キャンセル', style: 'cancel' },
          {
            text: '設定を開く',
            onPress: () => {
              void openNotificationSettings();
            },
          },
        ],
      );
      return;
    }

    void (async () => {
      await setNotificationUserEnabled(next);
      setUserEnabled(next);
    })();
  };

  if (!hydrated) {
    return null;
  }

  const systemStatusLabel =
    permissionState === 'granted' ? 'オン' : 'オフ（端末設定）';

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>通知</Text>
      <Text style={styles.description}>
        タイマーが終了したときに「終了」とお知らせします。
      </Text>

      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>タイマー終了通知</Text>
          <Text style={styles.rowHint}>
            {userEnabled
              ? 'アプリ内では通知を予約します'
              : '通知は予約されません'}
          </Text>
        </View>
        <Switch
          value={userEnabled}
          onValueChange={handleToggle}
          trackColor={{ false: '#d1d5db', true: ACCENT }}
          thumbColor="#ffffff"
          accessibilityLabel="タイマー終了通知"
        />
      </View>

      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>端末の通知設定</Text>
        <Text
          style={[
            styles.statusValue,
            permissionState === 'denied' && styles.statusValueOff,
          ]}
        >
          {systemStatusLabel}
        </Text>
      </View>

      {userEnabled && permissionState === 'denied' ? (
        <Text style={styles.warning}>
          端末で通知がオフになっています。下のボタンから設定を変更してください。
        </Text>
      ) : null}

      <Pressable
        style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}
        onPress={() => {
          void openNotificationSettings();
        }}
      >
        <Text style={styles.settingsButtonLabel}>端末の通知設定を開く</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  rowText: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  rowHint: {
    fontSize: 13,
    color: '#9ca3af',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  statusLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  statusValueOff: {
    color: '#b91c1c',
  },
  warning: {
    marginTop: 10,
    fontSize: 13,
    color: '#b45309',
    lineHeight: 18,
  },
  settingsButton: {
    marginTop: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.88,
  },
  settingsButtonLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
});
