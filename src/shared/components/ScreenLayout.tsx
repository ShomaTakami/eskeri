import { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MomentumBadge } from '../../features/momentum/components/MomentumBadge';
import { ACCENT } from '../theme/colors';

type ScreenLayoutProps = {
  appName?: string;
  title: string;
  subtitle?: string;
  showMomentum?: boolean;
  children: ReactNode;
};

export function ScreenLayout({
  appName,
  title,
  subtitle,
  showMomentum,
  children,
}: ScreenLayoutProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {appName ? (
          <Text style={[styles.appName, { color: ACCENT }]}>{appName}</Text>
        ) : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {appName ? (
          <Text style={styles.tagline}>Think less. Start now.</Text>
        ) : null}
        {showMomentum ? <MomentumBadge /> : null}
        {children}
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
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  appName: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 4,
    fontSize: 14,
    color: '#6b7280',
  },
  tagline: {
    marginBottom: 16,
    fontSize: 12,
    color: '#9ca3af',
    letterSpacing: 0.3,
  },
});
