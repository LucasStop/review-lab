import { storage } from './appStorage';
import { createCache } from './cache';

export const cache = createCache({ storage });
