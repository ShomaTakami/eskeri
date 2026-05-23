import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { StartStackParamList } from '../../../navigation/types';
import { ACCENT } from '../../../shared/theme/colors';
import { CircularProgress } from '../components/CircularProgress';
import { FeelingPicker } from '../components/FeelingPicker';
import { useMomentum } from '../../momentum/hooks/MomentumContext';
import { useActionStart } from '../hooks/ActionStartContext';
import {
  clearActiveTaskSession,
  getActiveTaskSession,
  resolvePhaseAfterTimerEnd,
  saveActiveTaskSession,
  updateActiveTaskSession,
  type ActiveTaskPhase,
  type ActiveTaskSession,
} from '../storage/activeTaskSession';
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

type TimerRouteProp = RouteProp<StartStackParamList, 'TimerScreen' | 'TaskComplete'>;
type NavigationProp = NativeStackNavigationProp<StartStackParamList>;

type Phase = ActiveTaskPhase;

function buildSessionSnapshot(params: {
  taskId: string;
  title: string;
  startedAt: string;
  heavinessBefore: number;
  phase: Phase;
  onExtension: boolean;
  momentumAwarded: boolean;
  timerClock: TimerClock;
  totalSeconds: number;
}): ActiveTaskSession {
  return {
    taskId: params.taskId,
    title: params.title,
    startedAt: params.startedAt,
    heavinessBefore: params.heavinessBefore,
    onExtension: params.onExtension,
    momentumAwarded: params.momentumAwarded,
    phase: params.phase,
    segmentStartedAtMs: params.timerClock.segmentStartedAtMs,
    endAtMs: params.timerClock.endAtMs,
    totalSeconds: params.totalSeconds,
  };
}

export function TimerScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<TimerRouteProp>();
  const isTaskCompleteEntry = route.name === 'TaskComplete';
  const { saveAction } = useActionStart();
  const { awardMomentum } = useMomentum();

  const [hydrated, setHydrated] = useState(!isTaskCompleteEntry);
  const [taskId, setTaskId] = useState(
    () => (route.name === 'TimerScreen' ? route.params.taskId : ''),
  );
  const [title, setTitle] = useState(
    () => (route.name === 'TimerScreen' ? route.params.title : ''),
  );
  const [startedAt, setStartedAt] = useState(
    () => (route.name === 'TimerScreen' ? route.params.startedAt : ''),
  );
  const [heavinessBefore, setHeavinessBefore] = useState(
    () => (route.name === 'TimerScreen' ? route.params.heavinessBefore : 0),
  );

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

  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;

  const persistSession = useCallback(
    async (nextPhase: Phase) => {
      if (!taskId) {
        return;
      }
      await saveActiveTaskSession(
        buildSessionSnapshot({
          taskId,
          title,
          startedAt,
          heavinessBefore,
          phase: nextPhase,
          onExtension: onExtensionRef.current,
          momentumAwarded: momentumAwardedRef.current,
          timerClock: timerClockRef.current,
          totalSeconds,
        }),
      );
    },
    [heavinessBefore, startedAt, taskId, title, totalSeconds],
  );

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
    void clearActiveTaskSession();
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
          void persistSession('feeling');
        } else {
          exitWithoutSaving();
        }
        return;
      }
      const nextPhase: Phase = !onExtensionRef.current
        ? 'startCheckpoint'
        : 'checkpoint';
      timerExpiredRef.current = true;
      setPhase(nextPhase);
      void persistSession(nextPhase);
    },
    [exitWithoutSaving, persistSession],
  );

  const handleEngaged = useCallback(() => {
    if (!momentumAwardedRef.current) {
      momentumAwardedRef.current = true;
      void awardMomentum(heavinessBefore);
    }
    setPhase('checkpoint');
    void persistSession('checkpoint');
    void updateActiveTaskSession(taskId, { momentumAwarded: true, phase: 'checkpoint' });
  }, [awardMomentum, heavinessBefore, persistSession, taskId]);

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
      timerExpiredRef.current = false;
      void persistSession('running');
    void updateActiveTaskSession(taskId, {
        onExtension: true,
        phase: 'running',
        totalSeconds: seconds,
        segmentStartedAtMs: timerClockRef.current.segmentStartedAtMs,
        endAtMs: timerClockRef.current.endAtMs,
      });
    },
    [persistSession, resetTimerClock, taskId],
  );

  const goToFeeling = useCallback(() => {
    if (!momentumAwardedRef.current) {
      return;
    }
    void cancelTimerNotification();
    setPhase('feeling');
    void persistSession('feeling');
  }, [persistSession]);

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
        await clearActiveTaskSession();
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
    if (!isTaskCompleteEntry) {
      if (route.name !== 'TimerScreen') {
        return;
      }
      const clock = createTimerClock(INITIAL_TIMER_SECONDS);
      timerClockRef.current = clock;
      void saveActiveTaskSession(
        buildSessionSnapshot({
          taskId: route.params.taskId,
          title: route.params.title,
          startedAt: route.params.startedAt,
          heavinessBefore: route.params.heavinessBefore,
          phase: 'running',
          onExtension: false,
          momentumAwarded: false,
          timerClock: clock,
          totalSeconds: INITIAL_TIMER_SECONDS,
        }),
      );
      setHydrated(true);
      return;
    }

    void (async () => {
      const session = await getActiveTaskSession(route.params.taskId);
      if (!session) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'HomeScreen' }],
        });
        return;
      }

      setTaskId(session.taskId);
      setTitle(session.title);
      setStartedAt(session.startedAt);
      setHeavinessBefore(session.heavinessBefore);
      onExtensionRef.current = session.onExtension;
      momentumAwardedRef.current = session.momentumAwarded;
      setTotalSeconds(session.totalSeconds);
      timerClockRef.current = {
        segmentStartedAtMs: session.segmentStartedAtMs,
        endAtMs: session.endAtMs,
      };

      const nextPhase = resolvePhaseAfterTimerEnd(session);
      timerExpiredRef.current = nextPhase !== 'running';
      setPhase(nextPhase);
      setRemainingSeconds(
        nextPhase === 'running'
          ? remainingSecondsFromTimerClock(timerClockRef.current)
          : 0,
      );
      setHydrated(true);
    })();
  }, [isTaskCompleteEntry, navigation, route]);

  useEffect(() => {
    if (!hydrated || phase !== 'running' || !taskId) {
      return;
    }
    const delaySeconds = remainingSecondsFromEndAt(timerClockRef.current.endAtMs);
    void (async () => {
      const scheduled = await scheduleTimerNotification(taskId, delaySeconds);
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
  }, [hydrated, phase, taskId, totalSeconds]);

  useEffect(() => {
    if (!hydrated || phase !== 'running') {
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
  }, [hydrated, phase, syncRemainingFromEndAt, goToCheckpoint]);

  if (!hydrated) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      </SafeAreaView>
    );
  }

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

        <CircularProgress progress={phase === 'running' ? progress : 0}>
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
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
