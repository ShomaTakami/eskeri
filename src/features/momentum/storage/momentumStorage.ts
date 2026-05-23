import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEYS } from '../../../shared/constants/storageKeys';

export async function loadMomentumPoints(): Promise<number> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.momentumPoints);
  if (!raw) {
    return 0;
  }
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

export async function saveMomentumPoints(points: number): Promise<void> {
  const safe = Math.max(0, Math.floor(points));
  await AsyncStorage.setItem(STORAGE_KEYS.momentumPoints, String(safe));
}
