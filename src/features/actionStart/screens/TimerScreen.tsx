import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { StartStackParamList } from '../../../navigation/types';
import { ACCENT } from '../../../shared/theme/colors';
import { CircularProgress } from '../components/CircularProgress';
import { FeelingPicker } from '../components/FeelingPicker';
import { useMomentum } from '../../momentum/hooks/MomentumContext';
import { useActionStart } from '../hooks/ActionStartContext';
import {
  cancelTimerNotification,
  scheduleTimerNotification,
} from '../services/timerNotifications';
import {
  EXTENSION_MINUTES,
  formatTimer,
  INITIAL_TIMER_SECONDS,
  minutesToSeconds,
  type ExtensionMinutes,
} from '../utils/formatTimer';

type TimerRouteProp = RouteProp<StartStackParamList, 'TimerScreen'>;
type NavigationProp = NativeStackNavigationProp<StartStackParamList, 'TimerScreen'>;

type Phase = 'running' | 'checkpoint' | 'feeling';

export function TimerScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<TimerRouteProp>();
  const { title, startedAt, heavinessBefore } = route.params;
  const { saveAction } = useActionStart();
  const { awardMomentum } = useMomentum();
  const [phase, setPhase] = useState<Phase>('running');
  const [remainingSeconds, setRemainingSeconds] = useState(INITIAL_TIMER_SECONDS);
  const [totalSeconds, setTotalSeconds] = useState(INITIAL_TIMER_SECONDS);
  const savingRef = useRef(false);
  const onExtensionRef = useRef(false);
  const momentumAwardedRef = useRef(false);

  const progress =
    totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;

  const goToCheckpoint = useCallback(
    (naturalExpiry = false) => {
      void cancelTimerNotification();
      setRemainingSeconds(0);
      if (
        naturalExpiry &&
        !onExtensionRef.current &&
        !momentumAwardedRef.current
      ) {
        momentumAwardedRef.current = true;
        void awardMomentum(heavinessBefore);
      }
      setPhase('checkpoint');
    },
    [awardMomentum, heavinessBefore],
  );

  const startExtension = useCallback((minutes: ExtensionMinutes) => {
    onExtensionRef.current = true;
    const seconds = minutesToSeconds(minutes);
    setTotalSeconds(seconds);
    setRemainingSeconds(seconds);
    setPhase('running');
  }, []);

  const goToFeeling = useCallback(() => {
    void cancelTimerNotification();
    setPhase('feeling');
  }, []);

  const handleFeelingSelect = useCallback(
    async (feelingAfter: number) => {
      if (savingRef.current) {
        return;
      }
      savingRef.current = true;
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
    },
    [heavinessBefore, navigation, saveAction, startedAt, title],
  );

  useEffect(() => {
    if (phase !== 'running') {
      return;
    }
    void scheduleTimerNotification(totalSeconds);
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
    if (remainingSeconds <= 0) {
      goToCheckpoint(true);
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, remainingSeconds, goToCheckpoint]);

  if (phase === 'feeling') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.feelingContainer}>
          <FeelingPicker onSelect={(feeling) => void handleFeelingSelect(feeling)} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.actionTitle}>{title}</Text>

        <CircularProgress progress={phase === 'checkpoint' ? 0 : progress}>
          {phase === 'checkpoint' ? (
            <Text style={styles.checkpointLabel}>完了</Text>
          ) : (
            <Text style={styles.timer}>{formatTimer(remainingSeconds)}</Text>
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
        ) : (
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
        )}
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
