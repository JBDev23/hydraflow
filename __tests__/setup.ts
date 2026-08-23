const mockStorage = new Map<string, string>();

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(async (key: string, value: string) => {
    mockStorage.set(key, value);
  }),
  getItem: jest.fn(async (key: string) => mockStorage.get(key) ?? null),
  removeItem: jest.fn(async (key: string) => {
    mockStorage.delete(key);
  }),
  clear: jest.fn(async () => {
    mockStorage.clear();
  }),
}));

let mockUuidCounter = 0;

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => {
    mockUuidCounter += 1;
    return `test-uuid-${mockUuidCounter}`;
  }),
}));

jest.mock('../utils/toast', () => ({
  showToast: jest.fn(),
}));

jest.mock('../app/i18n', () => ({
  __esModule: true,
  default: {
    language: 'es',
    t: (key: string) => key,
  },
}));

beforeEach(() => {
  mockStorage.clear();
  mockUuidCounter = 0;
  jest.clearAllMocks();
});

export { mockStorage as storage };
