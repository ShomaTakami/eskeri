import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEYS } from '../../../shared/constants/storageKeys';
import { MAX_REWARDS, type Reward } from '../types/reward';

function normalizeReward(raw: unknown): Reward | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const item = raw as Partial<Reward>;
  if (
    typeof item.id !== 'string' ||
    typeof item.title !== 'string' ||
    typeof item.requiredMomentum !== 'number'
  ) {
    return null;
  }
  const title = item.title.trim();
  const requiredMomentum = Math.max(1, Math.floor(item.requiredMomentum));
  if (!title) {
    return null;
  }
  return {
    id: item.id,
    title,
    requiredMomentum,
  };
}

export async function loadRewards(): Promise<Reward[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.rewards);
  if (!raw) {
    return [];
  }
  const parsed = JSON.parse(raw) as unknown[];
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed
    .map(normalizeReward)
    .filter((reward): reward is Reward => reward !== null)
    .slice(0, MAX_REWARDS);
}

export async function saveRewards(rewards: Reward[]): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEYS.rewards,
    JSON.stringify(rewards.slice(0, MAX_REWARDS)),
  );
}
