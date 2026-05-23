import { ScrollView, StyleSheet } from 'react-native';

import { ScreenLayout } from '../../../shared/components/ScreenLayout';
import { RewardsSection } from '../../../features/momentum/components/RewardsSection';
import { DebugSection } from '../components/DebugSection';
import { NotificationSettingsSection } from '../components/NotificationSettingsSection';

export function SettingsScreen() {
  return (
    <ScreenLayout
      title="Settings"
      subtitle="ご褒美と通知を設定できます。"
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <NotificationSettingsSection />
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
