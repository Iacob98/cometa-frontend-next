import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';
import {
  useProjects,
  useProject,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from '@/hooks/use-projects';
import { createMockQueryClient } from '../utils/test-utils';
import type { Project, CreateProjectRequest } from '@/types';

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createMockQueryClient();
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useProjects', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createMockQueryClient();
  });

  it('fetches projects successfully', async () => {
    const { result } = renderHook(() => useProjects(), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.data).toHaveLength(3);
    expect(result.current.data?.data[0].name).toBe('Project Alpha');
  });

  it('handles filters correctly', async () => {
    const { result } = renderHook(
      () => useProjects({ status: 'active', search: 'Alpha' }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.data).toHaveLength(1);
    expect(result.current.data?.data[0].name).toBe('Project Alpha');
  });

  it('handles pagination correctly', async () => {
    const { result } = renderHook(
      () => useProjects({ page: 1, per_page: 2 }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.page).toBe(1);
    expect(result.current.data?.per_page).toBe(2);
    expect(result.current.data?.data).toHaveLength(2);
  });

  it('handles error states correctly', async () => {
    // Override the handler to return an error
    server.use(
      http.get('/api/projects', () => {
        return HttpResponse.json(
          { error: 'Server error' },
          { status: 500 }
        );
      })
    );

    const { result } = renderHook(() => useProjects(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });

  it('refetches data when filters change', async () => {
    const { result, rerender } = renderHook(
      ({ filters }) => useProjects(filters),
      {
        wrapper,
        initialProps: { filters: { status: 'active' as const } },
      }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const initialData = result.current.data;

    // Change filters
    rerender({ filters: { status: 'completed' as const } });

    await waitFor(() => {
      expect(result.current.data).not.toBe(initialData);
    });
  });
});

describe('useProject', () => {
  it('fetches single project successfully', async () => {
    const { result } = renderHook(() => useProject('test-project-id'), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.id).toBe('test-project-id');
    expect(result.current.data?.name).toBeDefined();
  });

  it('does not fetch when id is undefined', async () => {
    const { result } = renderHook(() => useProject(undefined), {
      wrapper,
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('handles 404 errors gracefully', async () => {
    server.use(
      http.get('/api/projects/non-existent', () => {
        return HttpResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      })
    );

    const { result } = renderHook(() => useProject('non-existent'), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });
});

describe('useCreateProject', () => {
  it('creates project successfully', async () => {
    const { result } = renderHook(() => useCreateProject(), { wrapper });

    const newProjectData: CreateProjectRequest = {
      name: 'New Test Project',
      customer: 'Test Customer',
      city: 'Test City',
      totalLength: 1000,
      ratePerMeter: 30,
      startDate: '2024-01-01',
      pmUserId: 'test-pm-id',
    };

    await waitFor(async () => {
      const project = await result.current.mutateAsync(newProjectData);
      expect(project.name).toBe('New Test Project');
      expect(project.id).toBeDefined();
    });

    expect(result.current.isSuccess).toBe(true);
  });

  it('handles validation errors', async () => {
    server.use(
      http.post('/api/projects', () => {
        return HttpResponse.json(
          { error: 'Validation failed', details: ['Name is required'] },
          { status: 400 }
        );
      })
    );

    const { result } = renderHook(() => useCreateProject(), { wrapper });

    const invalidData = {} as CreateProjectRequest;

    await waitFor(async () => {
      try {
        await result.current.mutateAsync(invalidData);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    expect(result.current.isError).toBe(true);
  });

  it('invalidates queries on successful creation', async () => {
    const projectsQuerySpy = vi.fn();
    const queryClient = createMockQueryClient();

    // Spy on invalidateQueries
    vi.spyOn(queryClient, 'invalidateQueries').mockImplementation(projectsQuerySpy);

    const { result } = renderHook(() => useCreateProject(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    const newProjectData: CreateProjectRequest = {
      name: 'New Test Project',
      customer: 'Test Customer',
      city: 'Test City',
      totalLength: 1000,
      ratePerMeter: 30,
      startDate: '2024-01-01',
      pmUserId: 'test-pm-id',
    };

    await waitFor(async () => {
      await result.current.mutateAsync(newProjectData);
    });

    expect(projectsQuerySpy).toHaveBeenCalledWith({ queryKey: ['projects'] });
  });
});

describe('useUpdateProject', () => {
  it('updates project successfully', async () => {
    const { result } = renderHook(() => useUpdateProject(), { wrapper });

    const updateData = {
      name: 'Updated Project Name',
      customer: 'Updated Customer',
    };

    await waitFor(async () => {
      const updatedProject = await result.current.mutateAsync({
        id: 'test-project-id',
        data: updateData,
      });
      expect(updatedProject.name).toBe('Updated Project Name');
    });

    expect(result.current.isSuccess).toBe(true);
  });

  it('performs optimistic updates', async () => {
    const queryClient = createMockQueryClient();

    // Pre-populate cache with project data
    const existingProject: Project = {
      id: 'test-project-id',
      name: 'Original Name',
      customer: 'Original Customer',
      city: 'Berlin',
      status: 'active',
      totalLength: 1000,
      ratePerMeter: 25,
      startDate: '2024-01-01',
      pmUserId: 'test-pm-id',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    queryClient.setQueryData(['projects', 'test-project-id'], existingProject);

    const { result } = renderHook(() => useUpdateProject(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    const updateData = { name: 'Optimistically Updated Name' };

    // Start the mutation but don't await it yet
    const mutationPromise = result.current.mutateAsync({
      id: 'test-project-id',
      data: updateData,
    });

    // Check if optimistic update was applied
    const optimisticData = queryClient.getQueryData(['projects', 'test-project-id']);
    expect((optimisticData as Project).name).toBe('Optimistically Updated Name');

    // Now await the mutation
    await waitFor(() => mutationPromise);
  });

  it('reverts optimistic updates on error', async () => {
    // Mock server to return error
    server.use(
      http.put('/api/projects/test-project-id', () => {
        return HttpResponse.json(
          { error: 'Update failed' },
          { status: 500 }
        );
      })
    );

    const queryClient = createMockQueryClient();

    const existingProject: Project = {
      id: 'test-project-id',
      name: 'Original Name',
      customer: 'Original Customer',
      city: 'Berlin',
      status: 'active',
      totalLength: 1000,
      ratePerMeter: 25,
      startDate: '2024-01-01',
      pmUserId: 'test-pm-id',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    queryClient.setQueryData(['projects', 'test-project-id'], existingProject);

    const { result } = renderHook(() => useUpdateProject(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    const updateData = { name: 'Failed Update Name' };

    await waitFor(async () => {
      try {
        await result.current.mutateAsync({
          id: 'test-project-id',
          data: updateData,
        });
      } catch (error) {
        // Expected error
      }
    });

    // Check if data was reverted
    const revertedData = queryClient.getQueryData(['projects', 'test-project-id']);
    expect((revertedData as Project).name).toBe('Original Name');
  });
});

describe('useDeleteProject', () => {
  it('deletes project successfully', async () => {
    const { result } = renderHook(() => useDeleteProject(), { wrapper });

    await waitFor(async () => {
      await result.current.mutateAsync('test-project-id');
    });

    expect(result.current.isSuccess).toBe(true);
  });

  it('handles delete errors', async () => {
    server.use(
      http.delete('/api/projects/test-project-id', () => {
        return HttpResponse.json(
          { error: 'Cannot delete project with active work entries' },
          { status: 400 }
        );
      })
    );

    const { result } = renderHook(() => useDeleteProject(), { wrapper });

    await waitFor(async () => {
      try {
        await result.current.mutateAsync('test-project-id');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    expect(result.current.isError).toBe(true);
  });

  it('invalidates queries on successful deletion', async () => {
    const queryClient = createMockQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteProject(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    await waitFor(async () => {
      await result.current.mutateAsync('test-project-id');
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['projects'] });
  });
});