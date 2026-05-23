import { useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ACCENT } from '../../../shared/theme/colors';
import { useMomentum } from '../hooks/MomentumContext';
import { MAX_REWARDS, type Reward } from '../types/reward';

function rewardStatus(
  momentumPoints: number,
  requiredMomentum: number,
): { achieved: boolean; remaining: number } {
  const achieved = momentumPoints >= requiredMomentum;
  return {
    achieved,
    remaining: Math.max(0, requiredMomentum - momentumPoints),
  };
}

export function RewardsSection() {
  const {
    momentumPoints,
    rewards,
    useReward,
    upsertReward,
    removeReward,
  } = useMomentum();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftMomentum, setDraftMomentum] = useState('');
  const [adding, setAdding] = useState(false);

  const resetDraft = () => {
    setEditingId(null);
    setDraftTitle('');
    setDraftMomentum('');
    setAdding(false);
  };

  const startAdd = () => {
    resetDraft();
    setAdding(true);
  };

  const startEdit = (reward: Reward) => {
    setAdding(false);
    setEditingId(reward.id);
    setDraftTitle(reward.title);
    setDraftMomentum(String(reward.requiredMomentum));
  };

  const handleSaveDraft = async () => {
    const requiredMomentum = Number(draftMomentum);
    if (!Number.isFinite(requiredMomentum) || requiredMomentum < 1) {
      return;
    }
    const ok = await upsertReward({
      id: editingId ?? undefined,
      title: draftTitle,
      requiredMomentum,
    });
    if (ok) {
      resetDraft();
    }
  };

  const handleUseReward = (reward: Reward) => {
    const { achieved } = rewardStatus(momentumPoints, reward.requiredMomentum);
    if (!achieved) {
      return;
    }
    Alert.alert('このご褒美を使いますか？', reward.title, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'OK',
        onPress: () => {
          void useReward(reward);
        },
      },
    ]);
  };

  const showDraft = adding || editingId !== null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>ご褒美</Text>
      <Text style={styles.hint}>
        始められた自分への、ゆるいご褒美を設定しましょう。
      </Text>
      <Text style={styles.momentumLine}>
        Momentum <Text style={styles.momentumValue}>{momentumPoints}</Text>
      </Text>

      {rewards.length === 0 && !showDraft ? (
        <Text style={styles.empty}>まだ設定されていません</Text>
      ) : null}

      {rewards.map((reward) => {
        const { achieved, remaining } = rewardStatus(
          momentumPoints,
          reward.requiredMomentum,
        );
        const isEditing = editingId === reward.id;

        if (isEditing) {
          return null;
        }

        return (
          <View key={reward.id} style={styles.rewardRow}>
            <View style={styles.rewardMain}>
              <Text style={styles.rewardTitle}>{reward.title}</Text>
              <Text style={styles.rewardMeta}>
              {momentumPoints} / {reward.requiredMomentum}
                {achieved ? '(達成)' : ``}
              </Text>
            </View>
            <View style={styles.rewardActions}>
              {achieved ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.useButton,
                    { borderColor: ACCENT },
                    pressed && styles.pressed,
                  ]}
                  onPress={() => handleUseReward(reward)}
                >
                  <Text style={[styles.useLabel, { color: ACCENT }]}>
                    使う
                  </Text>
                </Pressable>
              ) : null}
              <Pressable onPress={() => startEdit(reward)} hitSlop={8}>
                <Text style={styles.editLink}>編集</Text>
              </Pressable>
            </View>
          </View>
        );
      })}

      {showDraft ? (
        <View style={styles.draftCard}>
          <TextInput
            style={styles.input}
            value={draftTitle}
            onChangeText={setDraftTitle}
            placeholder="例: コーヒー"
            placeholderTextColor="#9ca3af"
          />
          <TextInput
            style={styles.input}
            value={draftMomentum}
            onChangeText={setDraftMomentum}
            placeholder="必要な Momentum（例: 10）"
            placeholderTextColor="#9ca3af"
            keyboardType="number-pad"
          />
          <View style={styles.draftActions}>
            <Pressable onPress={resetDraft}>
              <Text style={styles.cancelLink}>キャンセル</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.saveButton,
                { backgroundColor: ACCENT },
                pressed && styles.pressed,
              ]}
              onPress={() => void handleSaveDraft()}
            >
              <Text style={styles.saveLabel}>保存</Text>
            </Pressable>
          </View>
          {editingId ? (
            <Pressable
              onPress={() => {
                void removeReward(editingId);
                resetDraft();
              }}
            >
              <Text style={styles.deleteLink}>削除</Text>
            </Pressable>
          ) : null}
        </View>
      ) : rewards.length < MAX_REWARDS ? (
        <Pressable style={styles.addButton} onPress={startAdd}>
          <Text style={styles.addLabel}>+ ご褒美を追加（最大{MAX_REWARDS}つ）</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 28,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  hint: {
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 20,
    marginBottom: 12,
  },
  momentumLine: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 16,
  },
  momentumValue: {
    fontWeight: '700',
    color: '#111827',
  },
  empty: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 12,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
    gap: 12,
  },
  rewardMain: {
    flex: 1,
    gap: 4,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  rewardMeta: {
    fontSize: 13,
    color: '#6b7280',
  },
  rewardActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  useButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    backgroundColor: '#ffffff',
  },
  useLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  editLink: {
    fontSize: 13,
    color: '#9ca3af',
  },
  draftCard: {
    marginTop: 8,
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  draftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  cancelLink: {
    fontSize: 14,
    color: '#6b7280',
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  deleteLink: {
    fontSize: 13,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 4,
  },
  addButton: {
    marginTop: 12,
    paddingVertical: 14,
  },
  addLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.88,
  },
});
