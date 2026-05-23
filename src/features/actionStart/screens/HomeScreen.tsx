import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { StartStackParamList } from '../../../navigation/types';
import { ScreenLayout } from '../../../shared/components/ScreenLayout';
import { ACCENT } from '../../../shared/theme/colors';
import { HeavinessPicker } from '../components/HeavinessPicker';

const PLACEHOLDER_EXAMPLES = [
  '勉強',
  '英語',
  '筋トレ',
  '掃除',
  '資料作成',
] as const;

type NavigationProp = NativeStackNavigationProp<StartStackParamList, 'HomeScreen'>;

export function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [title, setTitle] = useState('');
  const [heaviness, setHeaviness] = useState<number | null>(null);
  const [error, setError] = useState('');

  const handleStart = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setError('何を始めるか入力してください');
      return;
    }
    if (heaviness === null) {
      setError('今の重さを選んでください');
      return;
    }
    Keyboard.dismiss();
    setError('');
    navigation.navigate('TimerScreen', {
      title: trimmed,
      startedAt: new Date().toISOString(),
      heavinessBefore: heaviness,
    });
    setTitle('');
    setHeaviness(null);
  };

  return (
    <ScreenLayout
      appName="Eskeri"
      title="今日、何を始める？"
      subtitle="考えすぎる前に、始めよう。"
      showMomentum
    >
      <View style={styles.form}>
        <TextInput
          style={[styles.input, error && !title.trim() ? styles.inputError : null]}
          value={title}
          onChangeText={(text) => {
            setTitle(text);
            if (error) {
              setError('');
            }
          }}
          placeholder={PLACEHOLDER_EXAMPLES[0]}
          placeholderTextColor="#9ca3af"
          returnKeyType="done"
          onSubmitEditing={handleStart}
        />
        <Text style={styles.hints}>
          例: {PLACEHOLDER_EXAMPLES.join(' / ')}
        </Text>

        <HeavinessPicker value={heaviness} onChange={setHeaviness} />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={({ pressed }) => [
            styles.startButton,
            { backgroundColor: ACCENT },
            pressed && styles.pressed,
          ]}
          onPress={handleStart}
        >
          <Text style={styles.startLabel}>開始</Text>
        </Pressable>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 48,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 20,
    fontWeight: '600',
    backgroundColor: '#ffffff',
    color: '#111827',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  hints: {
    marginTop: 10,
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 20,
  },
  error: {
    marginTop: 16,
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '500',
  },
  startButton: {
    marginTop: 28,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.88,
  },
  startLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1,
  },
});
