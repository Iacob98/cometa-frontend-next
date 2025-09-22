# Project Documentation (Auto-generated from repository)

> Generated on: 2025-01-22
> Repository root: /Users/iacob/Documents/cometa-2-dev
> Commit: 03e51cf feat: Complete COMETA Next.js frontend implementation with working financial APIs

## Table of Contents
- [1. Overview](#1-overview)
- [2. Architecture Map](#2-architecture-map)
- [3. Frontend (Next.js)](#3-frontend-nextjs)
- [4. Backend (FastAPI)](#4-backend-fastapi)
- [5. API Contract](#5-api-contract)
- [6. Data Layer & Migrations](#6-data-layer--migrations)
- [7. Configuration & Environments](#7-configuration--environments)
- [8. Build, Run, CI/CD](#8-build-run-cicd)
- [9. Code Style, Linting, Tests](#9-code-style-linting-tests)
- [10. Security & Performance](#10-security--performance)
- [11. Migration Notes (Streamlit → Next/FastAPI)](#11-migration-notes-streamlit--nextfastapi)
- [12. Risks & Open Questions](#12-risks--open-questions)
- [13. Roadmap](#13-roadmap)
- [Appendix A. File Inventory](#appendix-a-file-inventory)
- [Appendix B. Key Snippets](#appendix-b-key-snippets)

---

## 1. Overview

**Stack summary:**
- Frontend: **NEXTJS** Next.js 15.5.3, React 19.1.0, TanStack Query 5.89.0, Zustand 5.0.8, shadcn/ui (Radix), Tailwind CSS 3.4.17
- Backend: **FASTAPI** FastAPI microservices (auth, project, work, team, material, equipment, activity, gateway), PostgreSQL 14
- **LEGACY-STREAMLIT**: Python 3.11+ with Streamlit 1.48+ (admin_app, worker_app)
- Infra: Docker Compose, PostgreSQL, Supabase integration, UV package manager
- Other: next-intl (i18n), NextAuth 4.24.11, Leaflet maps, Socket.io, Playwright testing

> Evidence: `cometa-frontend-clean/package.json:L46`, `docker-compose.yml:L118-275`, `admin_app/app.py:L1-50`

## 2. Architecture Map

**COMETA** is a Fiber Optic Construction Management System with hybrid architecture combining legacy Streamlit apps and modern Next.js/FastAPI microservices:

```mermaid
flowchart TB
    subgraph "Frontend Layer"
        NextJS[Next.js App<br/>Port: ⚡ Next.js dev]
        StreamlitAdmin[LEGACY-STREAMLIT<br/>Admin App<br/>Port: 8501]
        StreamlitWorker[LEGACY-STREAMLIT<br/>Worker App<br/>Port: 8502]
    end

    subgraph "API Gateway Layer"
        Gateway[FastAPI Gateway<br/>Port: 8080]
    end

    subgraph "Microservices Layer"
        Auth[Auth Service<br/>Port: 8001]
        Project[Project Service<br/>Port: 8002]
        Work[Work Service<br/>Port: 8003]
        Team[Team Service<br/>Port: 8004]
        Material[Material Service<br/>Port: 8005]
        Equipment[Equipment Service<br/>Port: 8006]
        Activity[Activity Service<br/>Port: 8011]
    end

    subgraph "Data Layer"
        DB[(PostgreSQL<br/>Port: 5422)]
        Supabase[(Supabase<br/>Storage & External)]
    end

    NextJS -->|HTTP/JSON| Gateway
    StreamlitAdmin -->|Direct SQL| DB
    StreamlitWorker -->|Direct SQL| DB
    Gateway -->|HTTP| Auth
    Gateway -->|HTTP| Project
    Gateway -->|HTTP| Work
    Gateway -->|HTTP| Team
    Gateway -->|HTTP| Material
    Gateway -->|HTTP| Equipment
    Gateway -->|HTTP| Activity
    Auth --> DB
    Project --> DB
    Work --> DB
    Team --> DB
    Material --> DB
    Equipment --> DB
    Activity --> DB
    NextJS -->|Storage| Supabase
    StreamlitAdmin -->|Storage| Supabase
```

**Evidence:** `docker-compose.yml:L17-275`, `fastapi_services/gateway/main.py:L44-63`, `cometa-frontend-clean/src/app/layout.tsx:L1-37`

## 3. Frontend (Next.js)

### **NEXTJS** Modern Frontend Implementation

**Routing:** App Router (Next.js 15+), file-based routing with TypeScript

* Evidence: `cometa-frontend-clean/src/app/layout.tsx:L18-37`, `cometa-frontend-clean/next.config.ts:L1-7`

**Data fetching:** TanStack Query for server state management, optimistic updates

```ts
// Evidence: cometa-frontend-clean/src/lib/providers.tsx:L16-36
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
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

**State:** Zustand for client state, TanStack Query for server state + sample:

```ts
// Path inference: cometa-frontend-clean/src/hooks/use-auth.ts (based on git status)
// Authentication and user state management via Zustand
```

**Styling:** Tailwind CSS + shadcn/ui components (Radix primitives)

* Config: `cometa-frontend-clean/tailwind.config.js` (referenced in package.json)
* Components: Radix UI primitives (`@radix-ui/react-*` packages in package.json:L24-36)

**API Integration:** 60+ API routes mapping to FastAPI microservices

* Evidence: API routes in `cometa-frontend-clean/src/app/api/**/route.ts` (60+ files detected)

## 4. Backend (FastAPI)

### **FASTAPI** Microservices Architecture

**Entry point & routers:**
- Gateway: `fastapi_services/gateway/main.py:L21-27`
- Auth service: `fastapi_services/auth_service/main.py:L66-72`
- 7 total microservices with standardized structure

**Models & Schemas:** Shared models in `shared/models.py:L10-100+`, Pydantic schemas per service

```python
# Path: shared/models.py:L10-27
class User(Base):
    __tablename__ = 'users'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first_name = Column(Text, nullable=False)
    last_name = Column(Text, nullable=False)
    phone = Column(Text, unique=True)
    email = Column(Text, unique=True)
    lang_pref = Column(Text, default='ru')
    role = Column(Text, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    skills = Column(JSONB)
    pin_code = Column(Text)  # 4-6 digit PIN for crew/foreman easy login
```

**Middleware & deps:** CORS middleware, database dependencies, authentication

* Evidence: `fastapi_services/gateway/main.py:L29-36`, `fastapi_services/auth_service/main.py:L74-81`

**Errors & logging:** Structured logging, HTTPException handling, health checks

* Gateway health: `fastapi_services/gateway/main.py:L77-84`
* Service health: `fastapi_services/auth_service/main.py:L99-109`

## 5. API Contract

### Gateway Service Routing (Port 8080)

**Pattern:** All routes proxied through gateway to microservices

* `POST|GET /api/auth/*` → Auth Service (Port 8001)
* `GET|POST|PUT|DELETE /api/projects/*` → Project Service (Port 8002)
* `GET|POST|PUT|DELETE /api/teams/*` → Team Service (Port 8004)
* `GET|POST|PUT|DELETE /api/work-entries/*` → Work Service (Port 8003)
* `GET|POST|PUT|DELETE /api/materials/*` → Material Service (Port 8005)
* `GET|POST|PUT|DELETE /api/equipment/*` → Equipment Service (Port 8006)
* `GET|POST|PUT|DELETE /api/activities/*` → Activity Service (Port 8011)

Evidence: `fastapi_services/gateway/main.py:L167-236`

### Authentication Flow

* `POST /api/auth/login` — PIN-based authentication
* **Auth:** PIN code + email/phone required
* **Request:** `{"email": "user@example.com", "pin_code": "1234"}`
* **Response:** `{"access_token": "...", "user": {...}, "expires_in": 3600}`
* **Errors:** 400 (validation), 401 (invalid credentials), 500 (server error)

Evidence: `fastapi_services/auth_service/main.py:L112-187`

### **NEXTJS** API Routes (Next.js Integration)

* Direct database queries via Docker exec (security concern)
* Example: `cometa-frontend-clean/src/app/api/auth/login/route.ts:L27-35`

```ts
// RISK: Direct SQL execution via Docker
const sqlQuery = `SELECT id, email, phone, first_name, last_name, role, lang_pref, pin_code FROM users WHERE email = '${email}' AND is_active = true;`;
const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${sqlQuery}"`;
```

## 6. Data Layer & Migrations

**Database:** PostgreSQL 14, SQLAlchemy 2.0 ORM, UUID primary keys

**Key models:** User, Project, Cabinet, Segment, Cut, WorkEntry hierarchy

* Evidence: `shared/models.py:L10-100`
* Relationships: Project → Cabinet → Segment → Cut → WorkEntry

**Migration strategy:**
- **LEGACY-STREAMLIT:** Direct database initialization via `shared/database.py`
- **FASTAPI:** Shared models, no explicit migration system detected
- **GAP:** No Alembic or formal migration management found

```python
// Path: shared/models.py:L52-54
__table_args__ = (
    CheckConstraint("status IN ('draft','active','waiting_invoice','closed')", name='check_project_status'),
)
```

## 7. Configuration & Environments

**Environment variables** (names only):
- Database: `DATABASE_URL`, `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`
- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Storage: `SUPABASE_*_BUCKET` (6 buckets: photos, documents, avatars, reports)
- Feature flags: `ENABLE_MICROSERVICES`, `DEBUG_MODE`
- Localization: `ADMIN_DEFAULT_LANG=de`, `WORKER_DEFAULT_LANG=ru`

**Environment profiles:**
- Docker: Service discovery via container names
- Local: localhost:port URLs for services

Evidence: `docker-compose.yml:L30-56`, `fastapi_services/gateway/main.py:L42-63`

## 8. Build, Run, CI/CD

**Local dev commands:**
```bash
# Next.js (modern frontend)
cd cometa-frontend-clean && npm run dev --turbopack

# LEGACY-STREAMLIT apps
./start_all.sh  # Both admin (8501) + worker (8502)
./start_admin.sh  # Admin only
./start_worker.sh # Worker only
```

**Docker/Compose:** 8 services, orchestrated startup

```yaml
# Evidence: docker-compose.yml:L2-15
services:
  postgres:
    image: postgres:14
    ports: ["5422:5432"]
  admin-app:  # LEGACY-STREAMLIT
    ports: ["8501:8501"]
  worker-app: # LEGACY-STREAMLIT
    ports: ["8502:8502"]
  # + 6 FastAPI microservices (8001-8006, 8011, 8080)
```

**Health checks:** Streamlit health endpoint `/_stcore/health`, FastAPI `/health`

Evidence: `docker-compose.yml:L59-64`, `fastapi_services/gateway/main.py:L77-84`

## 9. Code Style, Linting, Tests

**Frontend (Next.js):**
- ESLint: `eslint-config-next`, `eslint-config-prettier`
- Testing: Vitest + Playwright E2E, Testing Library React
- Coverage: `@vitest/coverage-v8`
- Commands: `npm run lint`, `npm run test`, `npm run test:e2e`

Evidence: `cometa-frontend-clean/package.json:L74-84`

**Backend (Python):**
- **GAP:** No linting/formatting config detected for Python services
- **GAP:** No test files found in `fastapi_services/*` directories

## 10. Security & Performance

**AuthN/AuthZ:** PIN-based authentication (4-6 digits), role-based access (`admin`, `pm`, `foreman`, `crew`, `viewer`, `worker`)

Evidence: `shared/models.py:L24-26`, `fastapi_services/auth_service/main.py:L134-161`

**CORS:** Permissive (`allow_origins=["*"]`) - **RISK** for production

Evidence: `fastapi_services/gateway/main.py:L30-36`

**RISK: SQL Injection** - Direct string interpolation in Next.js API routes

```ts
// Evidence: cometa-frontend-clean/src/app/api/auth/login/route.ts:L29-32
const sqlQuery = `SELECT ... WHERE email = '${email}' AND is_active = true;`;
```

**Performance:**
- TanStack Query caching (1 min stale time)
- Next.js with Turbopack for development
- **GAP:** No explicit caching strategy for FastAPI services

## 11. Migration Notes (Streamlit → Next/FastAPI)

### **LEGACY-STREAMLIT** components found:

* `admin_app/app.py:L1-50` - Main admin interface
* `worker_app/` - Field worker interface
* `admin_app/pages/*.py` - 13 numbered pages (project management modules)
* Microservice modules: `admin_app/project_preparation/`, `admin_app/resource_requests/`

### **MIGRATION-TODO** Checklist:

- [ ] **API Authentication:** Unify PIN-based auth between Streamlit (direct DB) and FastAPI (JWT tokens)
- [ ] **Database Access:** Replace direct SQL execution in Next.js with FastAPI calls
- [ ] **Session Management:** Migrate Streamlit session state to Next.js/TanStack Query
- [ ] **File Uploads:** Standardize Supabase storage access across all frontends
- [ ] **Internationalization:** Align next-intl (Next.js) with custom translations.py (Streamlit)

### Duplication patterns:
- Authentication logic: 3 implementations (Streamlit, Next.js direct, FastAPI)
- Database models: Shared via `shared/models.py` but different ORM usage patterns
- Material management: Both Streamlit pages and Next.js routes exist

## 12. Risks & Open Questions

### **RISK:** Security vulnerabilities
- **SQL Injection:** Next.js API routes use unescaped string interpolation (`cometa-frontend-clean/src/app/api/auth/login/route.ts:L29`)
- **CORS:** Overly permissive CORS settings in production
- **Docker exec:** Database access via shell commands instead of proper connections

### **GAP:** Missing infrastructure
- No formal database migration system (Alembic/Prisma)
- No CI/CD pipeline configuration detected
- No comprehensive testing strategy for microservices
- No API documentation (OpenAPI) centralization

### **RISK:** Architecture inconsistency
- 3 different authentication mechanisms
- Mixed database access patterns (direct SQL, SQLAlchemy, Docker exec)
- No service discovery beyond hardcoded URLs

### **GAP:** Monitoring and observability
- No centralized logging system
- No metrics collection (Prometheus/monitoring)
- No distributed tracing between microservices

## 13. Roadmap

### Phase 1: Security & Stability
- [ ] **Critical:** Replace SQL string interpolation with parameterized queries
- [ ] Implement proper database connection pooling for Next.js
- [ ] Add input validation middleware to all FastAPI services
- [ ] Configure production-ready CORS settings

### Phase 2: Migration Completion
- [ ] **MIGRATION-TODO:** Deprecate Streamlit admin_app in favor of Next.js
- [ ] **MIGRATION-TODO:** Migrate worker_app mobile interface to PWA
- [ ] Standardize authentication flow across all frontends
- [ ] Implement comprehensive API documentation with OpenAPI

### Phase 3: Architecture Optimization
- [ ] Add API rate limiting and caching
- [ ] Implement proper service discovery (Consul/etcd)
- [ ] Add monitoring stack (Prometheus + Grafana)
- [ ] Database migration system with rollback capability

### Phase 4: Feature Enhancement
- [ ] Real-time updates via WebSocket for all modules
- [ ] Advanced caching strategy (Redis)
- [ ] Audit logging for compliance
- [ ] Automated testing pipeline

---

## Appendix A. File Inventory

| Path | Role | Evidence |
|------|------|----------|
| `cometa-frontend-clean/package.json` | **NEXTJS** frontend dependencies | Next.js 15.5.3, React 19.1.0 |
| `fastapi_services/gateway/main.py` | **FASTAPI** API gateway entry point | Port 8080, service routing |
| `docker-compose.yml` | Multi-service orchestration | 8 services, health checks |
| `shared/models.py` | Database schema definitions | SQLAlchemy models, UUID PKs |
| `admin_app/app.py` | **LEGACY-STREAMLIT** admin interface | German default, auth flow |
| `worker_app/` | **LEGACY-STREAMLIT** field worker UI | Port 8502, Russian default |

## Appendix B. Key Snippets

### Next.js API Route Pattern
```ts
// Path: cometa-frontend-clean/src/app/api/auth/login/route.ts:L7-24
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, phone, pin_code } = body;

  // RISK: SQL injection vulnerability
  const sqlQuery = `SELECT id, email FROM users WHERE email = '${email}'`;
  const command = `docker exec cometa-2-dev-postgres-1 psql -U postgres -d cometa -t -c "${sqlQuery}"`;
}
```

### FastAPI Service Structure
```python
# Path: fastapi_services/auth_service/main.py:L66-81
app = FastAPI(
    title="COMETA Authentication Service",
    description="Microservice for user authentication and authorization",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # RISK: Too permissive
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Docker Service Configuration
```yaml
# Path: docker-compose.yml:L119-135
auth-service:
  build:
    context: .
    dockerfile: fastapi_services/auth_service/Dockerfile
  ports:
    - "8001:8001"
  environment:
    - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/cometa
    - PYTHONPATH=/app/shared:/app
```