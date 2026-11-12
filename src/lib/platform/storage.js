// Synchronous storage facade over AsyncStorage + SecureStore.
//
// The ported data layer (api.js / authStore.js / dashboard.js) was written for
// the browser's synchronous localStorage. React Native storage is async, so we
// keep an in-memory Map as the synchronous source of truth, hydrate it once at
// boot, and mirror every write to the real backend in the background.
//
// The auth token is the one secret we keep: it lives in SecureStore, everything
// else in AsyncStorage.

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const mem = new Map();
const pending = new Set();

export const TOKEN_KEY = 'masahati_token';

function track(promise) {
  const tracked = Promise.resolve(promise).catch(() => {});
  pending.add(tracked);
  tracked.finally(() => pending.delete(tracked));
  return tracked;
}

/** Load persisted values into memory. Must finish before auth is read. */
export async function hydrate() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    if (keys.length) {
      const pairs = await AsyncStorage.multiGet(keys);
      for (const [key, value] of pairs) {
        if (value != null && !mem.has(key)) mem.set(key, value);
      }
    }
  } catch {
    /* storage unavailable: memory-only session */
  }

  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) mem.set(TOKEN_KEY, token);
  } catch {
    /* secure storage unavailable: fall back to nothing */
  }
}

export function getItem(key) {
  return mem.has(key) ? mem.get(key) : null;
}

export function setItem(key, value) {
  if (value == null) {
    removeItem(key);
    return;
  }
  const text = String(value);
  mem.set(key, text);
  track(
    key === TOKEN_KEY
      ? SecureStore.setItemAsync(key, text)
      : AsyncStorage.setItem(key, text)
  );
}

export function removeItem(key) {
  mem.delete(key);
  track(
    key === TOKEN_KEY
      ? SecureStore.deleteItemAsync(key)
      : AsyncStorage.removeItem(key)
  );
}

/** Remove every key that starts with `prefix` (used for per-user markers). */
export function removeItemByPrefix(prefix) {
  for (const key of Array.from(mem.keys())) {
    if (key.startsWith(prefix)) removeItem(key);
  }
}

/**
 * Wait for every write/remove issued so far to land on disk.
 * Awaited on logout so a force-quit cannot resurrect the token.
 */
export async function flush() {
  while (pending.size) {
    await Promise.all(Array.from(pending));
  }
}
