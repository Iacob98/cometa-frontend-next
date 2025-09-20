import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/lib/providers';
import { WebSocketProvider } from '@/lib/websocket-provider';
import { Toaster } from 'sonner';
import type { User } from '@/types';

// Mock user for testing
const mockUser: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'admin',
  language: 'en',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  user?: User | null;
  route?: string;
}

// Create a custom render function that includes providers
function customRender(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: Infinity,
        },
        mutations: {
          retry: false,
        },
      },
    }),
    user = mockUser,
    route = '/',
    ...renderOptions
  } = options;

  // Mock next/navigation
  if (route !== '/') {
    // Set initial URL for testing
    window.history.pushState({}, 'Test page', route);
  }

  const Wrapper = ({ children }: { children: ReactNode }) => {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider initialUser={user}>
          <WebSocketProvider>
            {children}
            <Toaster />
          </WebSocketProvider>
        </AuthProvider>
      </QueryClientProvider>
    );
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Mock hooks for testing
export const createMockQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });
};

// Helper to create authenticated user context
export const createAuthenticatedUser = (overrides: Partial<User> = {}): User => ({
  ...mockUser,
  ...overrides,
});

// Helper to create unauthenticated context
export const createUnauthenticatedContext = () => null;

// Helper for testing different user roles
export const createUserWithRole = (role: User['role']): User => ({
  ...mockUser,
  role,
});

// Mock API responses helper
export const createMockApiResponse = <T>(data: T, pagination = false) => {
  if (pagination) {
    return {
      data,
      total: Array.isArray(data) ? data.length : 1,
      page: 1,
      per_page: 20,
      pages: 1,
    };
  }
  return data;
};

// Helper for testing error states
export const createMockError = (message = 'Test error', status = 500) => {
  const error = new Error(message) as any;
  error.status = status;
  error.response = {
    status,
    data: { error: message },
  };
  return error;
};

// Helper for testing loading states
export const createMockPendingPromise = () => {
  return new Promise(() => {}); // Never resolves for testing loading states
};

// Helper for async testing
export const waitFor = (callback: () => void | Promise<void>, timeout = 1000) => {
  return new Promise<void>((resolve, reject) => {
    const startTime = Date.now();

    const checkCondition = async () => {
      try {
        await callback();
        resolve();
      } catch (error) {
        if (Date.now() - startTime >= timeout) {
          reject(new Error(`Timeout after ${timeout}ms: ${error}`));
        } else {
          setTimeout(checkCondition, 50);
        }
      }
    };

    checkCondition();
  });
};

// Helper for testing form submissions
export const submitForm = async (form: HTMLFormElement, values: Record<string, any>) => {
  const { fireEvent } = await import('@testing-library/react');

  // Fill form fields
  Object.entries(values).forEach(([name, value]) => {
    const field = form.querySelector(`[name="${name}"]`) as HTMLInputElement;
    if (field) {
      fireEvent.change(field, { target: { value } });
    }
  });

  // Submit form
  fireEvent.submit(form);
};

// Helper for testing file uploads
export const createMockFile = (name = 'test.jpg', type = 'image/jpeg', size = 1024) => {
  const file = new File(['test content'], name, { type });
  Object.defineProperty(file, 'size', {
    value: size,
    configurable: true,
  });
  return file;
};

// Helper for testing localStorage
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach(key => delete store[key]);
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
    get length() {
      return Object.keys(store).length;
    },
  };
};

// Helper for testing WebSocket connections
export const createMockWebSocket = () => {
  const mockWs = {
    send: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    readyState: WebSocket.OPEN,
    onopen: null as ((event: Event) => void) | null,
    onclose: null as ((event: CloseEvent) => void) | null,
    onmessage: null as ((event: MessageEvent) => void) | null,
    onerror: null as ((event: Event) => void) | null,
  };

  // Helper methods for testing
  const trigger = {
    open: () => {
      if (mockWs.onopen) mockWs.onopen(new Event('open'));
    },
    close: () => {
      if (mockWs.onclose) mockWs.onclose(new CloseEvent('close'));
    },
    message: (data: any) => {
      if (mockWs.onmessage) {
        mockWs.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
      }
    },
    error: () => {
      if (mockWs.onerror) mockWs.onerror(new Event('error'));
    },
  };

  return { mockWs, trigger };
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Export custom render as default
export { customRender as render };