import { vi } from "vitest";

// Define IS_TEST_ENV for test environment
(globalThis as unknown as { IS_TEST_ENV: boolean }).IS_TEST_ENV = true;

// Mock Taro globals required by @tarojs/runtime
globalThis.ENABLE_INNER_HTML = true;
globalThis.ENABLE_ADJACENT_HTML = true;
globalThis.ENABLE_SIZE_APIS = true;
globalThis.ENABLE_TEMPLATE_CONTENT = true;
globalThis.ENABLE_CLONE_NODE = true;
globalThis.ENABLE_CONTAINS = true;
globalThis.ENABLE_MUTATION_OBSERVER = true;

// Mock Taro module
vi.mock("@tarojs/taro", () => ({
  default: {
    cloud: {
      database: vi.fn(),
      callFunction: vi.fn(),
      init: vi.fn(),
    },
    getStorageSync: vi.fn(),
    setStorageSync: vi.fn(),
  },
  cloud: {
    database: vi.fn(),
    callFunction: vi.fn(),
    init: vi.fn(),
  },
  getStorageSync: vi.fn(),
  setStorageSync: vi.fn(),
}));
