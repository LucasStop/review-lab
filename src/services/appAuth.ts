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
});
