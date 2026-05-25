import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ACCENT } from '../../../shared/theme/colors';
import { SCALE_VALUES } from '../utils/scale';

type HeavinessPickerProps = {
  value: number | null;
  onChange: (value: number) => void;
};

export function HeavinessPicker({ value, onChange }: HeavinessPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>今、この行動の重さはどのくらいですか？</Text>
      <View style={styles.row}>
        {SCALE_VALUES.map((n) => {
          const selected = value === n;
          return (
            <Pressable
              key={n}
              accessibilityRole="button"
              accessibilityLabel={`重さレベル${n}`}
              accessibilityState={{ selected }}
              style={[
                styles.button,
                selected && {
                  borderColor: ACCENT,
                  backgroundColor: ACCENT,
                },
              ]}
              onPress={() => onChange(n)}
            >
              <Text
                accessible={false}
                style={[
                  styles.number,
                  selected && styles.numberSelected,
                ]}
              >
                {n}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.scale}>
        <Text style={styles.scaleText}>1 = 軽い</Text>
        <Text style={styles.scaleText}>5 = かなり重い</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
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
  number: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
  },
  numberSelected: {
    color: '#ffffff',
  },
  scale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  scaleText: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
