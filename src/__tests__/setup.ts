import { config } from "@vue/test-utils";
import { vi } from "vitest";

// Глобальные моки для DOM API
global.CSS = { supports: vi.fn(() => false) };

// Мокаем window.matchMedia для Vuetify
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Мокаем localStorage
Object.defineProperty(window, "localStorage", {
  value: {
    getItem: vi.fn((key) => {
      if (key === "axenta_token") return "mock-token";
      if (key === "__vue-devtools-timeline-layers-state__") return "{}";
      return null;
    }),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// Мокаем sessionStorage
Object.defineProperty(window, "sessionStorage", {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// Мокаем window размеры
Object.defineProperty(window, "innerWidth", {
  writable: true,
  configurable: true,
  value: 1024,
});

Object.defineProperty(window, "innerHeight", {
  writable: true,
  configurable: true,
  value: 768,
});

// Мокаем ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Мокаем IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Мокаем console методы для чистого вывода тестов
global.console = {
  ...console,
  // Отключаем некритичные логи в тестах
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: console.error, // Оставляем ошибки для отладки
};

// Глобальные моки для Vue Test Utils
config.global.mocks = {
  $t: (key: string) => key, // Мок для i18n
  $route: {
    path: "/",
    params: {},
    query: {},
  },
  $router: {
    push: vi.fn(),
    replace: vi.fn(),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  },
};

// Мокаем fetch API
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
  })
) as any;

// Мокаем URL API
Object.defineProperty(window, "URL", {
  value: class MockURL {
    constructor(url, base) {
      this.href = url;
      this.origin = "http://localhost:3000";
      this.protocol = "http:";
      this.host = "localhost:3000";
      this.hostname = "localhost";
      this.port = "3000";
      this.pathname = "/";
      this.search = "";
      this.hash = "";
    }

    static createObjectURL = vi.fn(() => "blob:mock-url");
    static revokeObjectURL = vi.fn();
  },
  writable: true,
});

// Также добавляем глобальный URL
global.URL = window.URL;

// Мокаем Blob
global.Blob = vi.fn().mockImplementation((content, options) => ({
  size: content ? content.length : 0,
  type: options?.type || "",
  text: vi.fn().mockResolvedValue(content ? content.join("") : ""),
  arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
  stream: vi.fn(),
  slice: vi.fn(),
})) as any;

// Мокаем useErrorHandler
vi.mock("@/utils/errorHandler", () => ({
  useErrorHandler: () => ({
    handleError: vi.fn(),
    getUserMessage: vi.fn().mockReturnValue("Test error message"),
    getRecentErrors: vi.fn().mockReturnValue([]),
    clearErrors: vi.fn(),
  }),
  ErrorHandler: vi.fn(),
  globalErrorHandler: {
    handleError: vi.fn(),
    getUserMessage: vi.fn().mockReturnValue("Test error message"),
    getRecentErrors: vi.fn().mockReturnValue([]),
    clearErrors: vi.fn(),
  },
}));
