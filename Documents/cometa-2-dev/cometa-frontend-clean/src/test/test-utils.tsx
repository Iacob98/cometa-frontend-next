import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Providers } from '@/lib/providers';

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

// Mock data factories
export const createMockUser = (overrides = {}) => ({
  id: '123e4567-e89b-12d3-a456-426614174000',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  role: 'pm' as const,
  lang_pref: 'en' as const,
  is_active: true,
  permissions: ['project:read', 'project:write'],
  ...overrides,
});

export const createMockProject = (overrides = {}) => ({
  id: '123e4567-e89b-12d3-a456-426614174001',
  name: 'Test Project',
  customer: 'Test Customer',
  city: 'Berlin',
  status: 'active' as const,
  total_length_m: 1000,
  base_rate_per_m: 15.50,
  language_default: 'de' as const,
  start_date: '2024-01-01',
  ...overrides,
});

export const createMockWorkEntry = (overrides = {}) => ({
  id: '123e4567-e89b-12d3-a456-426614174002',
  project_id: '123e4567-e89b-12d3-a456-426614174001',
  user_id: '123e4567-e89b-12d3-a456-426614174000',
  date: '2024-01-15',
  stage_code: 'stage_2_excavation' as const,
  meters_done_m: 50,
  method: 'excavator' as const,
  ...overrides,
});

// API mock helpers
export const mockApiResponse = <T>(data: T) => ({
  ok: true,
  status: 200,
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data)),
});

export const mockApiError = (status: number, message: string) => ({
  ok: false,
  status,
  json: () => Promise.resolve({ message }),
  text: () => Promise.resolve(JSON.stringify({ message })),
});