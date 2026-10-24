import AsyncStorage from '@react-native-async-storage/async-storage';

import { createStorage } from './storage';

export const storage = createStorage({
  get: (key) => AsyncStorage.getItem(key),
  set: (key, value) => AsyncStorage.setItem(key, value),
  remove: (key) => AsyncStorage.removeItem(key),
});
