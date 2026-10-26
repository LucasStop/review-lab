import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteItemAsync, getItemAsync, setItemAsync } from 'expo-secure-store';

import { createAuth } from './session';
import { credentials } from './secureCredentials';

export const auth = createAuth({
  credentials,
  kv: {
    get: (key) => getItemAsync(key),
    set: (key, value) => setItemAsync(key, value),
    remove: (key) => deleteItemAsync(key),
  },
  removeUserData: async (userId) => {
    const prefix = `rl.${userId}.`;
    const keys = (await AsyncStorage.getAllKeys()).filter((key) => key.startsWith(prefix));
    await AsyncStorage.multiRemove(keys);
  },
});
