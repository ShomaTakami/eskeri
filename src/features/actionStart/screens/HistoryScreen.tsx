import { ActivityIndicator, SectionList, StyleSheet, Text, View } from 'react-native';

import { ScreenLayout } from '../../../shared/components/ScreenLayout';
import { HistoryLogItem } from '../components/HistoryLogItem';
import { HistoryStats } from '../components/HistoryStats';
import { useActionStart } from '../hooks/ActionStartContext';
import { computeActionStats } from '../utils/analytics';
import { groupLogsByDay } from '../utils/dates';

export function HistoryScreen() {
  const { actionLogs, loading } = useActionStart();
  const sections = groupLogsByDay(actionLogs);
  const stats = computeActionStats(actionLogs);

  if (loading) {
    return (
      <ScreenLayout title="自分の傾向">
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#111827" />
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      title="自分の傾向"
      subtitle="始めた記録から、自分のリズムが見えます。"
      showMomentum
    >
      <SectionList
        sections={sections.map((section) => ({
          title: section.title,
          data: section.logs,
        }))}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          actionLogs.length === 0 ? styles.emptyList : styles.list
        }
        ListHeaderComponent={
          actionLogs.length > 0 ? <HistoryStats stats={stats} /> : null
        }
        ListEmptyComponent={
          <View>
            <Text style={styles.emptyText}>
              まだ記録がありません。{'\n'}始めると、ここに傾向が見えてきます。
            </Text>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        )}
        renderItem={({ item }) => <HistoryLogItem log={item} />}
        stickySectionHeadersEnabled={false}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingBottom: 24,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6b7280',
    marginTop: 20,
    marginBottom: 4,
  },
});
