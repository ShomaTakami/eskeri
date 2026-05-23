import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { FeelingAfter } from '../types/actionLog';
import { feelingAfterLabel } from '../utils/labels';

const OPTIONS: FeelingAfter[] = ['light', 'normal', 'heavy'];

type FeelingPickerProps = {
  onSelect: (feeling: FeelingAfter) => void;
};

export function FeelingPicker({ onSelect }: FeelingPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.question}>始めてみてどうだった？</Text>
      <View style={styles.options}>
        {OPTIONS.map((option) => (
          <Pressable
            key={option}
            style={({ pressed }) => [styles.option, pressed && styles.pressed]}
            onPress={() => onSelect(option)}
          >
            <Text style={styles.optionLabel}>{feelingAfterLabel(option)}</Text>
          </Pressable>
        ))}
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
  options: {
    gap: 12,
  },
  option: {
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.88,
  },
  optionLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
});
