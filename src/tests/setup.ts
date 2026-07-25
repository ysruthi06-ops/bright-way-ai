import "@testing-library/jest-dom";
import { afterEach, beforeEach, vi } from "vitest";

// ─── In-memory localStorage ───────────────────────────────────────────────────
const localStorageStore: Record<string, string> = {};

const localStorageMock = {
  getItem: vi.fn((key: string) => localStorageStore[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageStore[key] = String(value);
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageStore[key];
  }),
  clear: vi.fn(() => {
    Object.keys(localStorageStore).forEach((k) => delete localStorageStore[k]);
  }),
  get length() {
    return Object.keys(localStorageStore).length;
  },
  key: vi.fn((i: number) => Object.keys(localStorageStore)[i] ?? null),
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

// ─── window.matchMedia ────────────────────────────────────────────────────────
Object.defineProperty(window, "matchMedia", {
  writable: true,
  configurable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ─── SpeechRecognition ────────────────────────────────────────────────────────
const SpeechRecognitionMock = vi.fn().mockImplementation(() => ({
  continuous: false,
  interimResults: true,
  lang: "en-US",
  start: vi.fn(),
  stop: vi.fn(),
  onresult: null,
  onend: null,
  onerror: null,
}));

Object.defineProperty(window, "SpeechRecognition", {
  writable: true,
  configurable: true,
  value: SpeechRecognitionMock,
});
Object.defineProperty(window, "webkitSpeechRecognition", {
  writable: true,
  configurable: true,
  value: SpeechRecognitionMock,
});

// ─── SpeechSynthesis ─────────────────────────────────────────────────────────
const speechSynthesisMock = {
  speak: vi.fn(),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  getVoices: vi.fn(() => []),
  speaking: false,
  pending: false,
  paused: false,
};

Object.defineProperty(window, "speechSynthesis", {
  writable: true,
  configurable: true,
  value: speechSynthesisMock,
});

// SpeechSynthesisUtterance mock
(global as any).SpeechSynthesisUtterance = vi.fn().mockImplementation((text: string) => ({
  text,
  rate: 1,
  pitch: 1,
  volume: 1,
  lang: "en-US",
}));

// ─── ResizeObserver ───────────────────────────────────────────────────────────
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// ─── IntersectionObserver ─────────────────────────────────────────────────────
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// ─── window.confirm ──────────────────────────────────────────────────────────
Object.defineProperty(window, "confirm", {
  writable: true,
  configurable: true,
  value: vi.fn(() => true),
});

// ─── window.location mock ───────────────────────────────────────────────────
Object.defineProperty(window, "location", {
  writable: true,
  configurable: true,
  value: { href: "/" },
});

// ─── Cleanup between tests ────────────────────────────────────────────────────
beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  // restore all mocks after each test
});
