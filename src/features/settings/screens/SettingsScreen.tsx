import { ScrollView, StyleSheet } from 'react-native';

import { ScreenLayout } from '../../../shared/components/ScreenLayout';
import { DebugSection } from '../components/DebugSection';
import { RewardsSection } from '../../../features/momentum/components/RewardsSection';

export function SettingsScreen() {
  return (
    <ScreenLayout title="Settings" subtitle="ご褒美の目安を設定できます。">
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <RewardsSection />
        <DebugSection />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
});
