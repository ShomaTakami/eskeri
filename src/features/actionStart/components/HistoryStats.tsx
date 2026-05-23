import { StyleSheet, Text, View } from 'react-native';

import { ACCENT } from '../../../shared/theme/colors';
import type { ActionStats } from '../utils/analytics';

type HistoryStatsProps = {
  stats: ActionStats;
};

export function HistoryStats({ stats }: HistoryStatsProps) {
  const maxCount = Math.max(
    1,
    ...stats.timeOfDaySlots.map((slot) => slot.count),
  );

  return (
    <View style={styles.container}>
      <View style={styles.countRow}>
        <View style={[styles.countCard, { backgroundColor: ACCENT }]}>
          <Text style={styles.countValue}>{stats.todayCount}</Text>
          <Text style={styles.countLabel}>今日始めた数</Text>
        </View>
        <View style={[styles.countCard, { backgroundColor: ACCENT }]}>
          <Text style={styles.countValue}>{stats.weekCount}</Text>
          <Text style={styles.countLabel}>今週始めた数</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>時間帯別の開始傾向</Text>
      <View style={styles.slots}>
        {stats.timeOfDaySlots.map((slot) => (
          <View key={slot.id} style={styles.slotRow}>
            <Text style={styles.slotLabel}>{slot.label}</Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${(slot.count / maxCount) * 100}%`,
                    backgroundColor: ACCENT,
                  },
                ]}
              />
            </View>
            <Text style={styles.slotCount}>{slot.count}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  countRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  countCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  countValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 2,
  },
  countLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  slots: {
    gap: 10,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  slotLabel: {
    width: 36,
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
    minWidth: 0,
  },
  slotCount: {
    width: 20,
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
});
