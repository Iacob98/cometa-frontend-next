# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**COMETA** is a Fiber Optic Construction Management System with hybrid architecture combining legacy Streamlit apps and modern Next.js/FastAPI microservices for fiber optic cable installation project management.

## Tech Stack

### **NEXTJS** Modern Frontend (Primary Development Focus)
- **Frontend**: Next.js 15.5.3, React 19.1.0, TanStack Query 5.89.0, Zustand 5.0.8
- **UI/Styling**: shadcn/ui (Radix), Tailwind CSS 3.4.17, Lucide React icons
- **Authentication**: NextAuth 4.24.11, PIN-based authentication
- **Maps**: Leaflet maps, react-leaflet
- **i18n**: next-intl for internationalization
- **Testing**: Vitest + Playwright E2E, Testing Library React

### **FASTAPI** Microservices Backend
- **API**: FastAPI microservices (auth, project, work, team, material, equipment, activity, gateway)
- **Database**: PostgreSQL 14 with SQLAlchemy 2.0 ORM
- **Architecture**: 7 microservices + API gateway on ports 8001-8006, 8011, 8080

### **LEGACY-STREAMLIT** (Migration in Progress)
- **Legacy Admin**: Python 3.11+ with Streamlit 1.48+ (admin_app, port 8501)
- **Legacy Worker**: Worker interface (worker_app, port 8502)
- **Package Manager**: UV (modern Python package manager)

### Infrastructure & Storage
- **Container**: Docker Compose orchestration
- **Database**: PostgreSQL (Supabase integration)
- **Storage**: Supabase buckets (photos, documents, avatars, reports)
- **Real-time**: Socket.io for live updates

## Commands

### Next.js Development (Primary)
```bash
# Start Next.js development server (recommended)
cd cometa-frontend-clean && npm run dev --turbopack

# Build for production
npm run build --turbopack

# Testing
npm run test        # Vitest unit tests
npm run test:e2e    # Playwright E2E tests
npm run lint        # ESLint code quality

# Type checking
npm run type-check  # TypeScript validation
```

### FastAPI Microservices
```bash
# Start all microservices via Docker
docker-compose up -d

# Individual service management
docker-compose logs auth-service
docker-compose logs gateway
docker-compose restart material-service

# Health checks
curl http://localhost:8080/health  # Gateway
curl http://localhost:8001/health  # Auth service
```

### Legacy Streamlit (Migration Target)
```bash
# LEGACY: Pre-startup cleanup (when needed)
pkill -f streamlit
lsof -ti:8501,8502 | xargs -r kill -9

# LEGACY: Start Streamlit apps
./start_all.sh      # Both admin (8501) + worker (8502)
./start_admin.sh    # Admin only
./start_worker.sh   # Worker only
```

### Version Control Workflow
```bash
# 🚨 CRITICAL: BRANCH STRATEGY 🚨
# main = STABLE (don't touch without permission!)
# dev = DEVELOPMENT (all changes here)

# 1. Always work in dev branch
git checkout dev
git pull origin dev

# 2. Make changes and commit
git add .
git commit -m "feat: description of completed task

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# 3. Push to dev branch ONLY
git push origin dev

# 🚫 DON'T touch main without permission!
```

## Architecture

### Hybrid System Architecture

```mermaid
flowchart TB
    subgraph "Frontend Layer"
        NextJS[Next.js App<br/>⚡ Primary Frontend<br/>Modern React]
        StreamlitAdmin[LEGACY Admin<br/>Port 8501<br/>Migration Target]
        StreamlitWorker[LEGACY Worker<br/>Port 8502<br/>Migration Target]
    end

    subgraph "API Gateway Layer"
        Gateway[FastAPI Gateway<br/>Port 8080<br/>Microservice Router]
    end

    subgraph "Microservices"
        Auth[Auth Service<br/>Port 8001]
        Project[Project Service<br/>Port 8002]
        Work[Work Service<br/>Port 8003]
        Team[Team Service<br/>Port 8004]
        Material[Material Service<br/>Port 8005]
        Equipment[Equipment Service<br/>Port 8006]
        Activity[Activity Service<br/>Port 8011]
    end

    subgraph "Data Layer"
        DB[(PostgreSQL<br/>Port 5422)]
        Supabase[(Supabase Storage<br/>Files & Buckets)]
    end

    NextJS -->|HTTP/JSON API| Gateway
    StreamlitAdmin -->|Direct SQL| DB
    StreamlitWorker -->|Direct SQL| DB
    Gateway --> Auth
    Gateway --> Project
    Gateway --> Work
    Gateway --> Team
    Gateway --> Material
    Gateway --> Equipment
    Gateway --> Activity
    Auth --> DB
    Project --> DB
    Work --> DB
    Team --> DB
    Material --> DB
    Equipment --> DB
    Activity --> DB
    NextJS -->|File Storage| Supabase
```

### **NEXTJS** Frontend Architecture

**File Structure (App Router):**
```
src/app/
├── (dashboard)/dashboard/           # Main app routes
│   ├── projects/                   # Project management
│   ├── work-entries/               # Work tracking
│   ├── teams/                      # Team management
│   ├── materials/                  # Material management
│   ├── equipment/                  # Equipment tracking
│   ├── financial/                  # Financial overview
│   ├── reports/                    # Analytics
│   ├── calendar/                   # Schedule management
│   ├── settings/                   # System settings
│   └── page.tsx                    # Dashboard home
├── api/                           # 60+ API routes
│   ├── auth/                      # Authentication
│   ├── projects/                  # Project CRUD
│   ├── work-entries/              # Work entry management
│   └── [other-resources]/         # Resource APIs
├── login/page.tsx                 # Authentication
└── layout.tsx                     # Root layout
```

**State Management:**
- **Server State**: TanStack Query (React Query) for API data
- **Client State**: Zustand for UI state and user preferences
- **Authentication**: NextAuth + custom hooks

**Data Fetching Pattern:**
```typescript
// TanStack Query with optimistic updates
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute cache
      retry: (failureCount, error) => {
        if (error instanceof Error && 'status' in error) {
          const status = (error as any).status;
          if (status >= 400 && status < 500) return false;
        }
        return failureCount < 3;
      },
    },
  },
})
```

### Database Schema Hierarchy
```
Project
├── Cabinet (Network distribution points)
│   └── Segment (Cable routes)
│       └── Cut (Excavation sections)
│           └── WorkEntry (Work logs with GPS/photos)
├── Crew/CrewMember (Team assignments)
├── MaterialAllocation (Resource tracking)
├── Equipment/VehicleAssignment
├── Cost/Transaction (Financial tracking)
└── Supplier Management
    ├── Supplier (Partner companies)
    ├── SupplierMaterial (Flexible material pricing)
    └── MaterialOrder (Order tracking)
```

### Authentication System
- **PIN Code System**: 4-6 digit PIN codes for easy worker login
- **Role-Based Access**: admin, pm, foreman, crew, viewer, worker
- **Session Management**: NextAuth + Zustand for Next.js, Streamlit session state for legacy
- **Test Users** (Quick login):
  - admin@cometa.de (Admin - full access)
  - pm@cometa.de (Project Manager - approve/manage)
  - foreman@cometa.de (Foreman - team lead)
  - worker@cometa.de (Crew - field work)
  - viewer@cometa.de (Viewer - read-only)

### API Integration Patterns

**Next.js API Routes → FastAPI Gateway:**
```typescript
// Next.js API route proxying to microservices
export async function GET(request: NextRequest) {
  const response = await fetch(`${GATEWAY_URL}/api/projects`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return Response.json(await response.json());
}
```

**Gateway Service Routing:**
- `POST|GET /api/auth/*` → Auth Service (Port 8001)
- `GET|POST|PUT|DELETE /api/projects/*` → Project Service (Port 8002)
- `GET|POST|PUT|DELETE /api/teams/*` → Team Service (Port 8004)
- `GET|POST|PUT|DELETE /api/work-entries/*` → Work Service (Port 8003)
- `GET|POST|PUT|DELETE /api/materials/*` → Material Service (Port 8005)
- `GET|POST|PUT|DELETE /api/equipment/*` → Equipment Service (Port 8006)
- `GET|POST|PUT|DELETE /api/activities/*` → Activity Service (Port 8011)

## Context7 Integration for Codebase Understanding

### Using Context7 for Library Documentation

When working with this codebase, use Context7 to get up-to-date documentation for libraries and frameworks:

```typescript
// Before implementing features, research with Context7:

// 1. Next.js App Router patterns
// Use: resolve-library-id "next.js"
// Then: get-library-docs with Next.js library ID

// 2. TanStack Query best practices
// Use: resolve-library-id "tanstack query"
// Then: get-library-docs for data fetching patterns

// 3. shadcn/ui component usage
// Use: resolve-library-id "radix-ui"
// Then: get-library-docs for component APIs

// 4. Tailwind CSS classes and utilities
// Use: resolve-library-id "tailwindcss"
// Then: get-library-docs for styling patterns
```

### Context7 Workflow for Feature Development

**Before implementing any new feature:**

1. **Research Framework Patterns:**
   ```bash
   # Get Next.js best practices for the feature type
   resolve-library-id "next.js"
   get-library-docs "/vercel/next.js" --topic="app-router data-fetching"
   ```

2. **Check Component Library:**
   ```bash
   # Get shadcn/ui component documentation
   resolve-library-id "shadcn"
   get-library-docs "/shadcn/ui" --topic="form components"
   ```

3. **Understand State Management:**
   ```bash
   # Research TanStack Query patterns
   resolve-library-id "tanstack query"
   get-library-docs "/tanstack/query" --topic="mutations optimistic-updates"
   ```

### Context7 for Specific Technologies

**Key libraries to research with Context7:**

| Technology | Use Case | Context7 Query |
|------------|----------|----------------|
| Next.js 15 | App Router, API routes | `resolve-library-id "next.js"` |
| TanStack Query 5 | Data fetching, caching | `resolve-library-id "tanstack query"` |
| shadcn/ui | UI components | `resolve-library-id "shadcn"` |
| Tailwind CSS | Styling utilities | `resolve-library-id "tailwindcss"` |
| React Hook Form | Form validation | `resolve-library-id "react hook form"` |
| Zod | Schema validation | `resolve-library-id "zod"` |
| Leaflet | Map components | `resolve-library-id "leaflet"` |
| Zustand | Client state | `resolve-library-id "zustand"` |

### Context7 Research Pattern

```typescript
// Research workflow for new components:

// 1. Get library documentation
const libraryDocs = await context7.getLibraryDocs('/vercel/next.js', {
  topic: 'server-components data-fetching'
});

// 2. Research best practices for specific features
const componentDocs = await context7.getLibraryDocs('/shadcn/ui', {
  topic: 'form table components'
});

// 3. Check latest patterns and examples
const queryDocs = await context7.getLibraryDocs('/tanstack/query', {
  topic: 'mutations error-handling'
});
```

## Critical Development Patterns

### Next.js Data Fetching Pattern
```typescript
// Server Component for initial data
export default async function ProjectsPage() {
  const initialData = await getProjects();

  return (
    <div>
      <ProjectsList initialData={initialData} />
    </div>
  );
}

// Client Component with TanStack Query
'use client';
export function ProjectsList({ initialData }: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: () => fetchProjects(),
    initialData,
    staleTime: 60 * 1000,
  });

  // Component logic
}
```

### Authentication Pattern
```typescript
// Check permissions in components
import { usePermissions } from '@/hooks/use-auth';

export function AdminOnlyComponent() {
  const { hasRole } = usePermissions();

  if (!hasRole('admin')) {
    return <div>Access denied</div>;
  }

  return <AdminInterface />;
}
```

### API Route Pattern
```typescript
// Next.js API route with error handling
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate with Zod
    const validatedData = schema.parse(body);

    // Call FastAPI microservice
    const response = await fetch(`${GATEWAY_URL}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return Response.json(await response.json());
  } catch (error) {
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Form Pattern with React Hook Form + Zod
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
});

export function ProjectForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Handle form submission with TanStack Query mutation
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>
    </Form>
  );
}
```

## Security & Performance

### Security Patterns
```typescript
// Input validation with Zod
const requestSchema = z.object({
  email: z.string().email(),
  pin_code: z.string().regex(/^\d{4,6}$/),
});

// Sanitize database queries (avoid SQL injection)
const query = `
  SELECT * FROM users
  WHERE email = $1 AND pin_code = $2 AND is_active = true
`;
const result = await db.query(query, [email, pinCode]);
```

### Performance Optimizations
```typescript
// TanStack Query caching strategy
const { data } = useQuery({
  queryKey: ['projects', filters],
  queryFn: () => fetchProjects(filters),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  keepPreviousData: true, // For pagination
});

// Next.js optimizations
export default function ProjectPage() {
  return (
    <Suspense fallback={<ProjectSkeleton />}>
      <ProjectContent />
    </Suspense>
  );
}
```

## Environment Configuration

### Required Environment Variables
```bash
# Database (PostgreSQL + Supabase)
DATABASE_URL=postgresql://postgres.{ref}:[password]@aws-1-eu-central-1.pooler.supabase.com:6543/postgres
PGHOST=aws-1-eu-central-1.pooler.supabase.com
PGPORT=6543
PGDATABASE=postgres
PGUSER=postgres.{ref}
PGPASSWORD=[password]

# Supabase Integration
NEXT_PUBLIC_SUPABASE_URL=https://{ref}.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon_key]

# Storage Buckets
SUPABASE_PROJECT_PHOTOS_BUCKET=project-photos
SUPABASE_WORK_PHOTOS_BUCKET=work-photos
SUPABASE_PROJECT_DOCUMENTS_BUCKET=project-documents
SUPABASE_HOUSE_DOCUMENTS_BUCKET=house-documents
SUPABASE_USER_AVATARS_BUCKET=user-avatars
SUPABASE_REPORTS_BUCKET=reports

# FastAPI Microservices
ENABLE_MICROSERVICES=true
DEBUG_MODE=false
GATEWAY_URL=http://localhost:8080

# Internationalization
ADMIN_DEFAULT_LANG=de
WORKER_DEFAULT_LANG=ru
```

## Testing Strategy

### Testing Commands
```bash
# Unit tests with Vitest
npm run test                 # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report

# E2E tests with Playwright
npm run test:e2e            # All E2E tests
npm run test:e2e:headed     # With browser UI
npm run test:e2e:debug      # Debug mode

# Linting and type checking
npm run lint                # ESLint
npm run type-check         # TypeScript
```

### Testing Patterns
```typescript
// Component testing with Vitest + Testing Library
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProjectsList } from './projects-list';

describe('ProjectsList', () => {
  it('renders projects correctly', () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ProjectsList />
      </QueryClientProvider>
    );

    expect(screen.getByText('Projects')).toBeInTheDocument();
  });
});

// E2E testing with Playwright
import { test, expect } from '@playwright/test';

test('user can create a new project', async ({ page }) => {
  await page.goto('/dashboard/projects');
  await page.click('[data-testid="new-project-button"]');
  await page.fill('[data-testid="project-name"]', 'Test Project');
  await page.click('[data-testid="save-button"]');

  await expect(page.locator('[data-testid="project-list"]')).toContainText('Test Project');
});
```

## Migration Strategy (Streamlit → Next.js)

### Migration Priority
1. **High Priority**: Core functionality (projects, work entries, materials)
2. **Medium Priority**: Reporting, analytics, user management
3. **Low Priority**: Legacy utilities, administrative tools

### Migration Checklist
- [ ] **API Authentication**: Unify PIN-based auth between Streamlit and FastAPI
- [ ] **Database Access**: Replace direct SQL with FastAPI calls
- [ ] **Session Management**: Migrate Streamlit session state to TanStack Query
- [ ] **File Uploads**: Standardize Supabase storage access
- [ ] **Internationalization**: Align next-intl with legacy translations

### Feature Parity Tracking
| Feature | Streamlit Status | Next.js Status | Priority |
|---------|------------------|----------------|----------|
| Project Management | ✅ Complete | ✅ Migrated | High |
| Work Entries | ✅ Complete | ✅ Migrated | High |
| Material Management | ✅ Complete | ✅ Migrated | High |
| Team Management | ✅ Complete | ✅ Migrated | High |
| Financial Tracking | ✅ Complete | ✅ Migrated | High |
| Reports & Analytics | ✅ Complete | 🚧 In Progress | Medium |
| Equipment Management | ✅ Complete | ✅ Migrated | Medium |
| User Administration | ✅ Complete | 🚧 Partial | Medium |
| Activity Logging | ✅ Complete | ✅ Migrated | Medium |

## Task Master AI Integration

**Import Task Master's development workflow commands and guidelines:**
@./.taskmaster/CLAUDE.md

### Task Master Usage with Next.js
```bash
# Initialize Task Master for Next.js features
task-master init

# Create tasks for component development
task-master add-task --prompt="Implement user settings page with role management"

# Track progress on features
task-master update-task --id=1 --prompt="Added basic layout and authentication check"

# Mark features complete
task-master set-status --id=1 --status=done
```

## Common Issues & Solutions

### Next.js Specific Issues

**TypeScript Errors:**
```typescript
// Fix: Proper type imports
import type { NextRequest } from 'next/server';
import type { User } from '@/types';

// Fix: Component prop types
interface Props {
  user: User;
  onUpdate: (user: User) => void;
}
```

**TanStack Query Issues:**
```typescript
// Fix: Proper error handling
const { data, error, isLoading } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  retry: (failureCount, error) => {
    // Don't retry on 4xx errors
    if (error?.status >= 400 && error?.status < 500) {
      return false;
    }
    return failureCount < 3;
  },
});
```

**Hydration Mismatches:**
```typescript
// Fix: Use dynamic imports for client-only components
import dynamic from 'next/dynamic';

const ClientOnlyComponent = dynamic(
  () => import('./client-component'),
  { ssr: false }
);
```

### Database Compatibility Issues
```typescript
// Fix: Proper UUID handling
import { z } from 'zod';

const uuidSchema = z.string().uuid();

// Fix: Decimal/numeric fields
const priceSchema = z.number().or(z.string()).pipe(z.coerce.number());
```

### FastAPI Integration Issues
```typescript
// Fix: Proper error handling from FastAPI
export async function POST(request: NextRequest) {
  try {
    const response = await fetch(`${GATEWAY_URL}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(await request.json()),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return Response.json(
        { error: errorData.detail || 'API error' },
        { status: response.status }
      );
    }

    return Response.json(await response.json());
  } catch (error) {
    return Response.json(
      { error: 'Network error' },
      { status: 500 }
    );
  }
}
```

## Best Practices Summary

### Development Workflow
1. **Context7 First**: Research libraries and patterns before implementation
2. **Type Safety**: Use TypeScript strictly, validate with Zod
3. **Performance**: Leverage Next.js optimizations and TanStack Query caching
4. **Testing**: Write tests for components and critical user flows
5. **Migration**: Gradually replace Streamlit features with Next.js equivalents

### Code Quality
1. **Consistent Patterns**: Follow established patterns for API routes, components, and state management
2. **Error Handling**: Implement proper error boundaries and fallbacks
3. **Accessibility**: Use semantic HTML and ARIA attributes
4. **Security**: Validate inputs, sanitize outputs, implement proper authentication

### Architecture Decisions
1. **API Design**: Keep Next.js API routes thin, delegate to FastAPI microservices
2. **State Management**: Use TanStack Query for server state, Zustand for client state
3. **Component Structure**: Build reusable components with proper TypeScript interfaces
4. **File Organization**: Follow Next.js App Router conventions for scalable structure