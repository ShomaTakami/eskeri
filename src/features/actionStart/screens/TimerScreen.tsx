import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { StartStackParamList } from '../../../navigation/types';
import { ACCENT } from '../../../shared/theme/colors';
import { CircularProgress } from '../components/CircularProgress';
import { FeelingPicker } from '../components/FeelingPicker';
import { useMomentum } from '../../momentum/hooks/MomentumContext';
import { useActionStart } from '../hooks/ActionStartContext';
import {
  cancelTimerNotification,
  openNotificationSettings,
  scheduleTimerNotification,
} from '../services/timerNotifications';
import {
  createTimerClock,
  remainingSecondsFromEndAt,
  remainingSecondsFromTimerClock,
  type TimerClock,
} from '../utils/timerEndAt';
import {
  EXTENSION_MINUTES,
  formatTimer,
  INITIAL_TIMER_SECONDS,
  minutesToSeconds,
  type ExtensionMinutes,
} from '../utils/formatTimer';

type TimerRouteProp = RouteProp<StartStackParamList, 'TimerScreen'>;
type NavigationProp = NativeStackNavigationProp<StartStackParamList, 'TimerScreen'>;

type Phase = 'running' | 'startCheckpoint' | 'checkpoint' | 'feeling';

export function TimerScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<TimerRouteProp>();
  const { title, startedAt, heavinessBefore } = route.params;
  const { saveAction } = useActionStart();
  const { awardMomentum } = useMomentum();
  const [phase, setPhase] = useState<Phase>('running');
  const [totalSeconds, setTotalSeconds] = useState(INITIAL_TIMER_SECONDS);
  const timerClockRef = useRef<TimerClock>(createTimerClock(INITIAL_TIMER_SECONDS));
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    remainingSecondsFromTimerClock(timerClockRef.current),
  );
  const savingRef = useRef(false);
  const onExtensionRef = useRef(false);
  const momentumAwardedRef = useRef(false);
  const notificationAlertShownRef = useRef(false);
  const timerExpiredRef = useRef(false);

  const progress =
    totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;

  /** segmentStartedAt / endAt を基準に残り秒を再計算（ロック復帰・バックグラウンド復帰用） */
  const syncRemainingFromEndAt = useCallback(() => {
    const remaining = remainingSecondsFromTimerClock(timerClockRef.current);
    setRemainingSeconds(remaining);
    return remaining;
  }, []);

  const resetTimerClock = useCallback((durationSeconds: number) => {
    timerClockRef.current = createTimerClock(durationSeconds);
    timerExpiredRef.current = false;
    return remainingSecondsFromTimerClock(timerClockRef.current);
  }, []);

  const exitWithoutSaving = useCallback(() => {
    void cancelTimerNotification();
    navigation.reset({
      index: 0,
      routes: [{ name: 'HomeScreen' }],
    });
  }, [navigation]);

  const goToCheckpoint = useCallback(
    (naturalExpiry = false) => {
      void cancelTimerNotification();
      setRemainingSeconds(0);
      if (!naturalExpiry) {
        if (onExtensionRef.current) {
          setPhase('feeling');
        } else {
          exitWithoutSaving();
        }
        return;
      }
      if (!onExtensionRef.current) {
        setPhase('startCheckpoint');
        return;
      }
      setPhase('checkpoint');
    },
    [exitWithoutSaving],
  );

  const handleEngaged = useCallback(() => {
    if (!momentumAwardedRef.current) {
      momentumAwardedRef.current = true;
      void awardMomentum(heavinessBefore);
    }
    setPhase('checkpoint');
  }, [awardMomentum, heavinessBefore]);

  const handleStartCheckpointEnd = useCallback(() => {
    exitWithoutSaving();
  }, [exitWithoutSaving]);

  const startExtension = useCallback(
    (minutes: ExtensionMinutes) => {
      onExtensionRef.current = true;
      const seconds = minutesToSeconds(minutes);
      setTotalSeconds(seconds);
      setRemainingSeconds(resetTimerClock(seconds));
      setPhase('running');
    },
    [resetTimerClock],
  );

  const goToFeeling = useCallback(() => {
    if (!momentumAwardedRef.current) {
      return;
    }
    void cancelTimerNotification();
    setPhase('feeling');
  }, []);

  const handleFeelingSelect = useCallback(
    async (feelingAfter: number) => {
      if (savingRef.current) {
        return;
      }
      savingRef.current = true;
      try {
        await cancelTimerNotification();
        const duration = Math.max(
          1,
          Math.round((Date.now() - new Date(startedAt).getTime()) / 1000),
        );
        await saveAction({
          title,
          startedAt,
          duration,
          heavinessBefore,
          feelingAfter,
          momentumAwarded: momentumAwardedRef.current,
        });
        navigation.reset({
          index: 0,
          routes: [{ name: 'HomeScreen' }],
        });
      } catch (error) {
        console.error('[Timer] save failed', error);
        Alert.alert('保存に失敗しました', 'もう一度お試しください。');
      } finally {
        savingRef.current = false;
      }
    },
    [heavinessBefore, navigation, saveAction, startedAt, title],
  );

  useEffect(() => {
    if (phase !== 'running') {
      return;
    }
    const delaySeconds = remainingSecondsFromEndAt(timerClockRef.current.endAtMs);
    void (async () => {
      const scheduled = await scheduleTimerNotification(delaySeconds);
      if (scheduled || notificationAlertShownRef.current) {
        return;
      }
      notificationAlertShownRef.current = true;
      Alert.alert(
        '通知がオフです',
        'タイマー終了の通知を受け取るには、端末の設定で Eskeri の通知をオンにしてください。',
        [
          { text: 'あとで', style: 'cancel' },
          {
            text: '設定を開く',
            onPress: () => {
              void openNotificationSettings();
            },
          },
        ],
      );
    })();
  }, [phase, totalSeconds]);

  useEffect(() => {
    return () => {
      void cancelTimerNotification();
    };
  }, []);

  useEffect(() => {
    if (phase !== 'running') {
      return;
    }

    const tick = () => {
      const remaining = syncRemainingFromEndAt();
      if (remaining <= 0 && !timerExpiredRef.current) {
        timerExpiredRef.current = true;
        goToCheckpoint(true);
      }
    };

    tick();

    const interval = setInterval(tick, 1000);
    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      // ロック直前（inactive/background）と復帰（active）の両方で endAt から再計算
      if (
        nextState === 'active' ||
        nextState === 'inactive' ||
        nextState === 'background'
      ) {
        tick();
      }
    });

    return () => {
      clearInterval(interval);
      appStateSubscription.remove();
    };
  }, [phase, syncRemainingFromEndAt, goToCheckpoint]);

  if (phase === 'feeling') {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.feelingContainer}>
          <FeelingPicker onSelect={(feeling) => void handleFeelingSelect(feeling)} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <Text style={styles.actionTitle}>{title}</Text>

        <CircularProgress
          progress={
            phase === 'running' ? progress : 0
          }
        >
          {phase === 'running' ? (
            <Text style={styles.timer}>{formatTimer(remainingSeconds)}</Text>
          ) : phase === 'startCheckpoint' ? (
            <Text style={styles.checkpointLabel}>終了</Text>
          ) : (
            <Text style={styles.checkpointLabel}>完了</Text>
          )}
        </CircularProgress>

        {phase === 'running' ? (
          <Pressable
            style={({ pressed }) => [
              styles.endButton,
              { backgroundColor: ACCENT },
              pressed && styles.pressed,
            ]}
            onPress={() => goToCheckpoint(false)}
          >
            <Text style={styles.endLabel}>終わる</Text>
          </Pressable>
        ) : null}

        {phase === 'startCheckpoint' ? (
          <View style={styles.startCheckpointActions}>
            <Pressable
              style={({ pressed }) => [
                styles.endButton,
                { backgroundColor: ACCENT },
                pressed && styles.pressed,
              ]}
              onPress={handleEngaged}
            >
              <Text style={styles.endLabel}>取り組めた</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                { borderColor: ACCENT },
                pressed && styles.pressed,
              ]}
              onPress={handleStartCheckpointEnd}
            >
              <Text style={[styles.secondaryLabel, { color: ACCENT }]}>
                終わる
              </Text>
            </Pressable>
          </View>
        ) : null}

        {phase === 'checkpoint' ? (
          <View style={styles.checkpointActions}>
            <Pressable
              style={({ pressed }) => [
                styles.endButton,
                { backgroundColor: ACCENT },
                pressed && styles.pressed,
              ]}
              onPress={goToFeeling}
            >
              <Text style={styles.endLabel}>終わる</Text>
            </Pressable>
            <View style={styles.extensionGrid}>
              {EXTENSION_MINUTES.map((minutes) => (
                <Pressable
                  key={minutes}
                  style={({ pressed }) => [
                    styles.extensionButton,
                    { borderColor: ACCENT },
                    pressed && styles.pressed,
                  ]}
                  onPress={() => startExtension(minutes)}
                >
                  <Text style={[styles.extensionLabel, { color: ACCENT }]}>
                    +{minutes}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fb',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feelingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 28,
  },
  timer: {
    fontSize: 44,
    fontWeight: '300',
    color: '#111827',
    fontVariant: ['tabular-nums'],
  },
  checkpointLabel: {
    fontSize: 36,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 2,
  },
  endButton: {
    marginTop: 40,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.88,
  },
  endLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  startCheckpointActions: {
    width: '100%',
    marginTop: 40,
    gap: 12,
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  secondaryLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  checkpointActions: {
    width: '100%',
    marginTop: 40,
    gap: 16,
  },
  extensionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  extensionButton: {
    width: '47%',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  extensionLabel: {
    fontSize: 17,
    fontWeight: '700',
  },
});
