import { RewardsSection } from '../../../features/momentum/components/RewardsSection';
import { ScreenLayout } from '../../../shared/components/ScreenLayout';

export function SettingsScreen() {
  return (
    <ScreenLayout title="Settings" subtitle="ご褒美の目安を設定できます。">
      <RewardsSection />
    </ScreenLayout>
  );
}
