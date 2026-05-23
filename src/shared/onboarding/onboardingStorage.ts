import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEYS } from '../constants/storageKeys';

export async function isOnboardingCompleted(): Promise<boolean> {
  const value = await AsyncStorage.getItem(STORAGE_KEYS.onboardingCompleted);
  return value === 'true';
}

export async function setOnboardingCompleted(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.onboardingCompleted, 'true');
}
