import { create } from 'axios';

import { config } from '../config';

export const api = create({
  baseURL: 'https://api.github.com',
  timeout: 15000,
  headers: {
    Accept: 'application/vnd.github+json',
    ...(config.token ? { Authorization: `Bearer ${config.token}` } : {}),
  },
});
