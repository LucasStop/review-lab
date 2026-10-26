import { jest } from '@jest/globals';

// AsyncStorage é módulo nativo: nos testes de componente entra o mock oficial em memória.
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
