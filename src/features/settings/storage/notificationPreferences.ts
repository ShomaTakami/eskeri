import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEYS } from '../../../shared/constants/storageKeys';

/** 未設定時は true（通知 ON） */
export async function isNotificationUserEnabled(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.notificationUserEnabled);
  if (raw === null) {
    return true;
  }
  return raw === 'true';
}

export async function setNotificationUserEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEYS.notificationUserEnabled,
    enabled ? 'true' : 'false',
  );
}
