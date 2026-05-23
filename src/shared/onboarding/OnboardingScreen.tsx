import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { setOnboardingCompleted } from './onboardingStorage';

type OnboardingScreenProps = {
  onComplete: () => void;
};

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [page, setPage] = useState(0);

  const handleComplete = async () => {
    await setOnboardingCompleted();
    onComplete();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {page === 0 ? (
          <View style={styles.page}>
            <Text style={styles.brand}>Eskeri</Text>
            <Text style={styles.tagline}>Think less.{'\n'}Start now.</Text>
            <Pressable
              style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}
              onPress={() => setPage(1)}
            >
              <Text style={styles.textButtonLabel}>次へ</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.page}>
            <Text style={styles.body}>
              億劫なことも、{'\n'}5分だけ。{'\n\n'}始めれば、{'\n'}あとは自由。
            </Text>
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
              onPress={() => void handleComplete()}
            >
              <Text style={styles.primaryLabel}>始める</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  page: {
    flex: 1,
    justifyContent: 'center',
  },
  brand: {
    fontSize: 40,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 24,
  },
  tagline: {
    fontSize: 22,
    fontWeight: '300',
    color: '#374151',
    lineHeight: 34,
    marginBottom: 48,
  },
  body: {
    fontSize: 22,
    fontWeight: '400',
    color: '#111827',
    lineHeight: 36,
    marginBottom: 56,
  },
  textButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  textButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  primaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: '#111827',
    alignSelf: 'flex-start',
  },
  primaryLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
  },
  pressed: {
    opacity: 0.88,
  },
});
