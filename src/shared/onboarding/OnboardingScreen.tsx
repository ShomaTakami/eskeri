import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { setOnboardingCompleted } from './onboardingStorage';

const PAGE_COUNT = 2;

type OnboardingScreenProps = {
  onComplete: () => void;
};

function PageIndicator({ current }: { current: number }) {
  return (
    <View style={styles.indicator}>
      {Array.from({ length: PAGE_COUNT }, (_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            current === index ? styles.dotActive : styles.dotInactive,
          ]}
        />
      ))}
    </View>
  );
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [page, setPage] = useState(0);

  const handleComplete = async () => {
    try {
      await setOnboardingCompleted();
    } catch {
      // 保存失敗時も先に進める（再表示は次回起動時の可能性あり）
    }
    onComplete();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <View style={styles.content}>
          {page === 0 ? (
            <View style={styles.page}>
              <Text style={styles.brand}>Eskeri</Text>
              <Text style={styles.tagline}>
                Think less.{'\n'}Start now.
              </Text>
            </View>
          ) : (
            <View style={styles.page}>
              <Text style={styles.body}>
                億劫なことも、{'\n'}5分だけ。
              </Text>
              <Text style={styles.bodySecondary}>
                始めれば、{'\n'}あとは自由。
              </Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <PageIndicator current={page} />
          {page === 0 ? (
            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.pressed,
              ]}
              onPress={() => setPage(1)}
            >
              <Text style={styles.secondaryLabel}>次へ</Text>
            </Pressable>
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.pressed,
              ]}
              onPress={() => void handleComplete()}
            >
              <Text style={styles.primaryLabel}>始める</Text>
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  page: {
    gap: 20,
  },
  brand: {
    fontSize: 42,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 22,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.72)',
    lineHeight: 32,
    letterSpacing: 0.2,
  },
  body: {
    fontSize: 26,
    fontWeight: '600',
    color: '#ffffff',
    lineHeight: 38,
    letterSpacing: -0.3,
  },
  bodySecondary: {
    fontSize: 22,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.72)',
    lineHeight: 34,
  },
  footer: {
    paddingBottom: 16,
    gap: 28,
  },
  indicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotInactive: {
    width: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  dotActive: {
    width: 24,
    backgroundColor: '#ffffff',
  },
  secondaryButton: {
    alignSelf: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    minWidth: 200,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
  },
  secondaryLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  primaryButton: {
    alignSelf: 'center',
    paddingVertical: 16,
    paddingHorizontal: 40,
    minWidth: 200,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  primaryLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.82,
  },
});
