import { CryptoDigestAlgorithm, digestStringAsync, getRandomBytesAsync } from 'expo-crypto';
import { deleteItemAsync, getItemAsync, setItemAsync } from 'expo-secure-store';

import { createCredentials } from './credentials';

const toHex = (bytes: Uint8Array) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

export const credentials = createCredentials({
  kv: {
    get: (key) => getItemAsync(key),
    set: (key, value) => setItemAsync(key, value),
    remove: (key) => deleteItemAsync(key),
  },
  sha256: (text) => digestStringAsync(CryptoDigestAlgorithm.SHA256, text),
  randomSalt: async () => toHex(await getRandomBytesAsync(16)),
});
