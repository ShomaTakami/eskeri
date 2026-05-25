import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ACCENT } from '../../../shared/theme/colors';
import { SCALE_VALUES } from '../utils/scale';

type FeelingPickerProps = {
  onSelect: (feeling: number) => void;
};

export function FeelingPicker({ onSelect }: FeelingPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.question}>取り組んだあと、いかがでしたか？</Text>
      <View style={styles.row}>
        {SCALE_VALUES.map((n) => (
          <Pressable
            key={n}
            accessibilityRole="button"
            accessibilityLabel={`完了後の感覚レベル${n}`}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => onSelect(n)}
          >
            {({ pressed }) => (
              <Text
                accessible={false}
                style={[styles.number, pressed && styles.numberPressed]}
              >
                {n}
              </Text>
            )}
          </Pressable>
        ))}
      </View>
      <View style={styles.scale}>
        <Text style={styles.scaleText}>1 = 軽かった</Text>
        <Text style={styles.scaleText}>5 = 重かった</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 24,
  },
  question: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 28,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  buttonPressed: {
    borderColor: ACCENT,
    backgroundColor: ACCENT,
  },
  number: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
  },
  numberPressed: {
    color: '#ffffff',
  },
  scale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  scaleText: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
