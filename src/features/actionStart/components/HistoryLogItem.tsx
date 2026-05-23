import { StyleSheet, Text, View } from 'react-native';

import type { ActionLog } from '../types/actionLog';
import { formatTime } from '../utils/dates';
import { feelingAfterLabel } from '../utils/labels';

type HistoryLogItemProps = {
  log: ActionLog;
};

export function HistoryLogItem({ log }: HistoryLogItemProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{log.title}</Text>
        <Text style={styles.time}>{formatTime(log.startedAt)}</Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>
          開始前: <Text style={styles.metaValue}>{log.heavinessBefore}</Text>
        </Text>
        <Text style={styles.metaDot}>·</Text>
        <Text style={styles.meta}>
          完了後: <Text style={styles.metaValue}>{feelingAfterLabel(log.feelingAfter)}</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    marginRight: 12,
  },
  time: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6b7280',
    fontVariant: ['tabular-nums'],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meta: {
    fontSize: 13,
    color: '#9ca3af',
  },
  metaValue: {
    color: '#4b5563',
    fontWeight: '600',
  },
  metaDot: {
    marginHorizontal: 8,
    fontSize: 13,
    color: '#d1d5db',
  },
});
