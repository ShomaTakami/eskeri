import { StyleSheet, Text, View } from 'react-native';

import { useMomentum } from '../hooks/MomentumContext';

export function MomentumBadge() {
  const { momentumPoints, loading } = useMomentum();

  if (loading) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>
        Momentum <Text style={styles.value}>{momentumPoints}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '500',
  },
  value: {
    fontWeight: '700',
    color: '#6b7280',
  },
});
