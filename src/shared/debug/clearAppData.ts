import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEYS } from '../constants/storageKeys';
import { clearOnboardingCompleted } from '../onboarding/onboardingStorage';

export async function debugResetOnboarding(): Promise<void> {
  await clearOnboardingCompleted();
}

export async function debugClearAllData(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
}
