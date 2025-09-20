import { http, HttpResponse } from 'msw';
import type {
  User,
  Project,
  WorkEntry,
  Team,
  Material,
  Equipment,
  Notification,
  Document,
  GeospatialFeature,
  PaginatedResponse,
} from '@/types';

// Mock data generators
const createMockUser = (overrides = {}): User => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'admin',
  language: 'en',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

const createMockProject = (overrides = {}): Project => ({
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

const createMockWorkEntry = (overrides = {}): WorkEntry => ({
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

const createMockTeam = (overrides = {}): Team => ({
  id: 'test-team-id',
  name: 'Test Team',
  projectId: 'test-project-id',
  foremanId: 'test-foreman-id',
  members: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

const createPaginatedResponse = <T>(data: T[], total?: number): PaginatedResponse<T> => ({
  data,
  total: total ?? data.length,
  page: 1,
  per_page: 20,
  pages: Math.ceil((total ?? data.length) / 20),
});

export const handlers = [
  // Authentication handlers
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as { email: string; pin?: string };

    if (body.email === 'test@example.com') {
      return HttpResponse.json({
        user: createMockUser(),
        token: 'mock-jwt-token',
      });
    }

    return HttpResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ success: true });
  }),

  http.get('/api/auth/me', ({ request }) => {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.includes('Bearer')) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return HttpResponse.json(createMockUser());
  }),

  // Projects handlers
  http.get('/api/projects', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const perPage = parseInt(url.searchParams.get('per_page') || '20');
    const search = url.searchParams.get('search');
    const status = url.searchParams.get('status');

    let projects = [
      createMockProject({ id: '1', name: 'Project Alpha', status: 'active' }),
      createMockProject({ id: '2', name: 'Project Beta', status: 'completed' }),
      createMockProject({ id: '3', name: 'Project Gamma', status: 'planning' }),
    ];

    // Apply filters
    if (search) {
      projects = projects.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.customer.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (status) {
      projects = projects.filter(p => p.status === status);
    }

    // Pagination
    const start = (page - 1) * perPage;
    const paginatedProjects = projects.slice(start, start + perPage);

    return HttpResponse.json(createPaginatedResponse(paginatedProjects, projects.length));
  }),

  http.get('/api/projects/:id', ({ params }) => {
    const { id } = params;
    return HttpResponse.json(createMockProject({ id: id as string }));
  }),

  http.post('/api/projects', async ({ request }) => {
    const body = await request.json() as Partial<Project>;
    const newProject = createMockProject({
      id: `project-${Date.now()}`,
      ...body,
    });

    return HttpResponse.json(newProject, { status: 201 });
  }),

  http.put('/api/projects/:id', async ({ params, request }) => {
    const { id } = params;
    const body = await request.json() as Partial<Project>;

    const updatedProject = createMockProject({
      id: id as string,
      ...body,
      updatedAt: new Date().toISOString(),
    });

    return HttpResponse.json(updatedProject);
  }),

  http.delete('/api/projects/:id', () => {
    return HttpResponse.json({ success: true });
  }),

  // Work Entries handlers
  http.get('/api/work-entries', ({ request }) => {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('project_id');
    const status = url.searchParams.get('status');

    let workEntries = [
      createMockWorkEntry({ id: '1', projectId: projectId || 'test-project-id', status: 'pending' }),
      createMockWorkEntry({ id: '2', projectId: projectId || 'test-project-id', status: 'approved' }),
      createMockWorkEntry({ id: '3', projectId: projectId || 'test-project-id', status: 'completed' }),
    ];

    if (status) {
      workEntries = workEntries.filter(we => we.status === status);
    }

    return HttpResponse.json(createPaginatedResponse(workEntries));
  }),

  http.post('/api/work-entries', async ({ request }) => {
    const body = await request.json() as Partial<WorkEntry>;
    const newWorkEntry = createMockWorkEntry({
      id: `work-entry-${Date.now()}`,
      ...body,
    });

    return HttpResponse.json(newWorkEntry, { status: 201 });
  }),

  http.put('/api/work-entries/:id', async ({ params, request }) => {
    const { id } = params;
    const body = await request.json() as Partial<WorkEntry>;

    const updatedWorkEntry = createMockWorkEntry({
      id: id as string,
      ...body,
      updatedAt: new Date().toISOString(),
    });

    return HttpResponse.json(updatedWorkEntry);
  }),

  // Teams handlers
  http.get('/api/teams', ({ request }) => {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('project_id');

    const teams = [
      createMockTeam({ id: '1', name: 'Team Alpha', projectId: projectId || 'test-project-id' }),
      createMockTeam({ id: '2', name: 'Team Beta', projectId: projectId || 'test-project-id' }),
    ];

    return HttpResponse.json(createPaginatedResponse(teams));
  }),

  http.post('/api/teams', async ({ request }) => {
    const body = await request.json() as Partial<Team>;
    const newTeam = createMockTeam({
      id: `team-${Date.now()}`,
      ...body,
    });

    return HttpResponse.json(newTeam, { status: 201 });
  }),

  // Notifications handlers
  http.get('/api/notifications', () => {
    const notifications = [
      {
        id: '1',
        userId: 'test-user-id',
        title: 'New work entry submitted',
        message: 'Work entry #123 needs approval',
        type: 'work_entry_submitted',
        isRead: false,
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        userId: 'test-user-id',
        title: 'Project updated',
        message: 'Project Alpha has been updated',
        type: 'project_updated',
        isRead: true,
        createdAt: '2024-01-01T00:00:00Z',
      },
    ];

    return HttpResponse.json(createPaginatedResponse(notifications));
  }),

  http.put('/api/notifications/:id/read', ({ params }) => {
    return HttpResponse.json({ success: true });
  }),

  // Documents handlers
  http.get('/api/documents', () => {
    const documents = [
      {
        id: '1',
        filename: 'project-plan.pdf',
        size: 1024000,
        contentType: 'application/pdf',
        projectId: 'test-project-id',
        uploadedBy: 'test-user-id',
        createdAt: '2024-01-01T00:00:00Z',
      },
    ];

    return HttpResponse.json(createPaginatedResponse(documents));
  }),

  http.post('/api/documents/upload', async ({ request }) => {
    // Mock file upload
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate upload time

    return HttpResponse.json({
      id: `doc-${Date.now()}`,
      filename: 'uploaded-file.pdf',
      size: 1024000,
      contentType: 'application/pdf',
      url: '/mock-upload-url',
      createdAt: new Date().toISOString(),
    }, { status: 201 });
  }),

  // Geospatial handlers
  http.get('/api/geospatial/features', () => {
    const features = [
      {
        id: '1',
        type: 'Point',
        geometry: {
          type: 'Point',
          coordinates: [13.405, 52.52],
        },
        properties: {
          name: 'Test Point',
          description: 'A test geospatial point',
        },
        projectId: 'test-project-id',
        entityType: 'project',
        entityId: 'test-project-id',
        createdAt: '2024-01-01T00:00:00Z',
      },
    ];

    return HttpResponse.json(createPaginatedResponse(features));
  }),

  // Error simulation handlers
  http.get('/api/error/500', () => {
    return HttpResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }),

  http.get('/api/error/timeout', async () => {
    await new Promise(resolve => setTimeout(resolve, 30000)); // Simulate timeout
    return HttpResponse.json({ data: 'This should timeout' });
  }),

  // WebSocket mock (for testing WebSocket connections)
  http.get('/api/ws/connect', () => {
    return HttpResponse.json({
      wsUrl: 'ws://localhost:8080/ws',
      token: 'mock-ws-token'
    });
  }),
];

// Error handlers for unhandled requests
export const errorHandlers = [
  http.all('*', ({ request }) => {
    console.error(`Unhandled ${request.method} request to ${request.url}`);
    return HttpResponse.json(
      { error: `Unhandled ${request.method} request to ${request.url}` },
      { status: 404 }
    );
  }),
];