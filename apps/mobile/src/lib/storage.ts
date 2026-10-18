import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Filters } from '@wtl/core';
import { restoreFilters } from './filters';

// Last filters, kept on the device only.
const KEY = 'wtl.filters.v1';

export async function loadFilters(): Promise<Filters | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? restoreFilters(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export async function saveFilters(f: Filters): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(f));
  } catch {
    // Not critical: the app works without a saved state.
  }
}
