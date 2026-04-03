# SufiPulse AI Coding Guidelines

## Architecture Overview
SufiPulse is a Next.js 14 app with dual modes: **standalone** (localStorage-based, no backend) and **full backend** (Express.js + PostgreSQL via Supabase). The app manages Sufi poetry, music releases, and contributor profiles with role-based access.

## Key Components
- **Frontend**: Next.js app router (`app/`), components organized by feature (`components/auth/`, `components/literary/`, etc.)
- **Authentication**: `AuthContext` + `storage.ts` (standalone) or JWT (backend)
- **Data Layer**: `lib/storage.ts` for localStorage ops, `lib/supabase-client.ts` for backend
- **Types**: Centralized in `types/*.types.ts` (e.g., `WriterFormData`, `Release`)
- **Styling**: Tailwind CSS 4 with design tokens in `styles/design-tokens.css`

## Data Flow
- **Standalone**: All data in browser localStorage via `storage.ts` service
- **Backend**: REST API (`backend/`) with PostgreSQL schemas in `supabase/migrations/`
- **Static Data**: Releases/articles in `data/*.ts` for initial content

## Authentication Patterns
- Roles: `user`, `admin`, plus profile-specific (writer, vocalist, producer, literary, studio)
- Profile creation: Forms in `user/*/page.tsx` submit to storage service
- Access control: Check `user.role` and `profile.profile_status` in components

## Development Workflow
- **Dev**: `npm run dev` (localhost:3000)
- **Build**: `npm run build` (static export possible via `next.config.mjs`)
- **Lint**: `npm run lint` (ESLint)
- **Deploy**: Standalone to any static host; backend to Node.js platforms

## Conventions
- **File Structure**: Feature-based components (`components/literary/`, `components/producers/`)
- **Imports**: Absolute paths with `@/` alias (e.g., `@/components/ui/Button`)
- **Forms**: Controlled components with TypeScript interfaces from `types/`
- **State**: React Context for auth (`AuthContext`), localStorage for persistence
- **API**: RESTful endpoints in `api/` for backend mode
- **Naming**: Kebab-case for files (`writer-profile.tsx`), PascalCase for components

## Examples
- **Add Release**: Edit `data/releases.ts` array with `Release` interface
- **New Component**: Place in `components/feature/` (e.g., `components/literary/KalamCard.tsx`)
- **Profile Form**: Use `WriterFormData` type, submit via `storage.createWriterProfile()`
- **Auth Check**: `if (!user || user.role !== 'admin') return <AccessDenied />`

## Migration Notes
When switching to backend: Update `AuthContext` to use API calls instead of `storage.ts`, replace localStorage with Supabase client.</content>
<parameter name="filePath">c:\Users\Fayaz\Sufipulseupdate2026\Sufipulseupdate\.github\copilot-instructions.md