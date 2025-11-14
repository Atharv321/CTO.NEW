import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Create a localStorage mock that actually stores data
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    // Helper for tests
    __getStore: () => ({ ...store }),
    __setStore: (newStore: Record<string, string>) => {
      store = { ...newStore };
    }
  };
};

const localStorageMock = createLocalStorageMock();
vi.stubGlobal('localStorage', localStorageMock);

// Reset localStorage before each test
beforeEach(() => {
  localStorageMock.clear();
});

// Mock btoa for JWT testing
vi.stubGlobal('btoa', (str: string) => {
  return Buffer.from(str).toString('base64');
});

// Mock atob for JWT testing
vi.stubGlobal('atob', (str: string) => {
  return Buffer.from(str, 'base64').toString();
});

// Export the mock for use in tests
export { localStorageMock };