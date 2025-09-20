import { expect, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { server } from './mocks/server';

// Extend Vitest matchers with Testing Library matchers
expect.extend(matchers);

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
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

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock URL constructor
global.URL.createObjectURL = vi.fn();
global.URL.revokeObjectURL = vi.fn();

// Mock fetch if not available
if (!global.fetch) {
  global.fetch = vi.fn();
}

// Mock WebSocket
global.WebSocket = vi.fn().mockImplementation(() => ({
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: WebSocket.OPEN,
}));

// Mock console methods for cleaner test output
global.console = {
  ...console,
  // Suppress console.log in tests unless explicitly needed
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Set up MSW server
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  vi.clearAllMocks();
  localStorageMock.clear();
  sessionStorageMock.clear();
});

afterAll(() => {
  server.close();
});

// Global test utilities
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'admin',
  language: 'en',
  ...overrides,
});

export const createMockProject = (overrides = {}) => ({
  id: 'test-project-id',
  name: 'Test Project',
  customer: 'Test Customer',
  city: 'Test City',
  status: 'active',
  totalLength: 1000,
  ratePerMeter: 25,
  startDate: '2024-01-01',
  pmUserId: 'test-pm-id',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockWorkEntry = (overrides = {}) => ({
  id: 'test-work-entry-id',
  projectId: 'test-project-id',
  cutId: 'test-cut-id',
  userId: 'test-user-id',
  stage: 'stage_1_preparation',
  metersDone: 100,
  hoursWorked: 8,
  status: 'pending',
  description: 'Test work entry',
  latitude: 52.52,
  longitude: 13.405,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockTeam = (overrides = {}) => ({
  id: 'test-team-id',
  name: 'Test Team',
  projectId: 'test-project-id',
  foremanId: 'test-foreman-id',
  members: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

// Test environment setup
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:8080';
process.env.NEXT_PUBLIC_AUTH_SERVICE_URL = 'http://localhost:8001';
process.env.NEXT_PUBLIC_PROJECT_SERVICE_URL = 'http://localhost:8002';
process.env.NEXT_PUBLIC_WORK_SERVICE_URL = 'http://localhost:8003';
process.env.NEXT_PUBLIC_TEAM_SERVICE_URL = 'http://localhost:8004';
process.env.NEXT_PUBLIC_MATERIAL_SERVICE_URL = 'http://localhost:8005';
process.env.NEXT_PUBLIC_EQUIPMENT_SERVICE_URL = 'http://localhost:8006';
process.env.NEXT_PUBLIC_ACTIVITY_SERVICE_URL = 'http://localhost:8011';