# COMETA Frontend - Next.js Migration (Phase 1)

> Modern fiber optic construction management system frontend built with Next.js 14

## 📋 Overview

This is Phase 1 of the COMETA frontend migration from Streamlit to Next.js. This implementation provides a solid foundation with modern architecture, comprehensive TypeScript types, and full integration with existing FastAPI microservices.

## 🏗️ Architecture

### Tech Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: TanStack Query + Zustand
- **Forms**: React Hook Form + Zod validation
- **Authentication**: Custom JWT-based auth system
- **Testing**: Vitest + Testing Library
- **Dev Tools**: ESLint, Prettier, TypeScript

### Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication routes
│   └── (dashboard)/       # Protected dashboard routes
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui base components
│   └── layout/           # Layout components
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and configurations
├── types/                # TypeScript type definitions
└── test/                 # Testing utilities
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or bun
- Access to COMETA FastAPI services

### Installation

1. **Install dependencies**:
   ```bash
   cd cometa-frontend-clean
   npm install
   ```

2. **Environment setup**:
   ```bash
   # .env.local is already configured for development
   # Edit if needed for your environment
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Open application**:
   Navigate to [http://localhost:3001](http://localhost:3001)

### Available Scripts

```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run tests with Vitest
npm run test:ui      # Run tests with UI
npm run test:run     # Run tests once
npm run test:coverage # Run tests with coverage
```

## 🔐 Authentication

The system uses a custom JWT-based authentication with PIN codes for easy worker access:

### Test Users (Development)
| Role | Email | PIN | Permissions |
|------|-------|-----|-------------|
| Admin | admin@fiber.com | 1234 | Full system access |
| Project Manager | pm1@fiber.com | 5678 | Project management |
| Foreman | foreman1@fiber.com | 9012 | Team supervision |
| Worker | worker1@fiber.com | 7086 | Work entry creation |
| Viewer | viewer1@fiber.com | 3456 | Read-only access |

### Usage
1. Navigate to `/login`
2. Enter email and PIN
3. System automatically redirects to dashboard based on role

## 📡 API Integration

### Microservices Architecture
The frontend integrates with existing FastAPI microservices:

- **Auth Service** (8001): User authentication
- **Project Service** (8002): Project management
- **Work Service** (8003): Work entries
- **Team Service** (8004): Team management
- **Material Service** (8005): Materials tracking
- **Equipment Service** (8006): Equipment management
- **Activity Service** (8011): Activity logging

## 🎨 UI Components

Built on shadcn/ui with consistent design system:
- Modern, accessible components
- Responsive design patterns
- Role-based navigation
- Professional color scheme

## 🚧 Phase 1 Completion Status

### ✅ Completed Features
- [x] Next.js 14 project setup with TypeScript
- [x] Tailwind CSS + shadcn/ui integration
- [x] ESLint + Prettier configuration
- [x] TypeScript types for all FastAPI services
- [x] TanStack Query API integration
- [x] Custom JWT authentication system
- [x] Vitest testing framework
- [x] Comprehensive API client adapters
- [x] Root layout with providers
- [x] Login page with test users
- [x] Dashboard layout with navigation
- [x] Responsive sidebar and header
- [x] Role-based access control
- [x] Environment configuration

### 🔄 Phase 2 Roadmap (Planned)
- [ ] Complete CRUD operations for all entities
- [ ] Advanced form validation with Zod
- [ ] Real-time updates with WebSockets
- [ ] File upload functionality
- [ ] Enhanced error boundaries
- [ ] Performance optimizations
- [ ] E2E test coverage
- [ ] PWA capabilities

## 🏃‍♂️ Quick Start Commands

```bash
# Clone and setup (if needed)
cd cometa-frontend-clean
npm install

# Start development
npm run dev

# Run tests
npm test

# Build for production
npm run build
npm start
```

---

**Status**: Phase 1 Complete ✅
**Next**: Phase 2 - Advanced Features & Real-time Capabilities
**Version**: 2.0.0-phase1
**Last Updated**: December 2024
