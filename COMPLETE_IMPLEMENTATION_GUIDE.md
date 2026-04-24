# Complete Implementation Code for Remaining Phases

## Phase 4: Testing Infrastructure

### Install Dependencies
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitejs/plugin-react playwright
npx playwright install
```

### File: `vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './__tests__/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', '__tests__/'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

### File: `playwright.config.ts`
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './__tests__/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### File: `__tests__/setup.ts`
```typescript
import '@testing-library/jest-dom';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock fetch
global.fetch = vi.fn();
```

### File: `__tests__/unit/components/ErrorBoundary.test.tsx`
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '@/app/components/ui/ErrorBoundary';
import { describe, it, expect, vi } from 'vitest';

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Test Content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders fallback on error', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('calls onError callback', () => {
    const onError = vi.fn();
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
  });
});
```

### File: `__tests__/e2e/homepage.spec.ts`
```typescript
import { test, expect } from '@playwright/test';

test('homepage loads correctly', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/SufiPulse/);
});

test('navigation works', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Releases');
  await expect(page).toHaveURL(/releases/);
});

test('mobile menu works', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  await page.click('[aria-label="Open menu"]');
  await expect(page.locator('text=Menu')).toBeVisible();
});
```

### Update `package.json` scripts:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

---

## Phase 5: Sentry Integration

### Install
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### File: `sentry.client.config.ts`
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.replayIntegration(),
  ],
});
```

### File: `sentry.server.config.ts`
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

### File: `app/lib/sentry.ts`
```typescript
import * as Sentry from '@sentry/nextjs';

export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, { extra: context });
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, { level });
}

export function setUser(user: { id: string; email: string }) {
  Sentry.setUser(user);
}

export function addBreadcrumb(message: string, category?: string) {
  Sentry.addBreadcrumb({ message, category });
}
```

---

## Phase 6: Accessibility (a11y)

### Install
```bash
npm install -D eslint-plugin-jsx-a11y
```

### Update `.eslintrc.json`
```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:jsx-a11y/recommended"
  ]
}
```

### File: `app/components/ui/AccessibleButton.tsx`
```typescript
"use client";

interface Props {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  ariaLabel: string;
  variant?: 'primary' | 'secondary';
}

export function AccessibleButton({ 
  children, 
  onClick, 
  type = 'button',
  disabled = false,
  ariaLabel,
  variant = 'primary'
}: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`px-4 py-2 rounded ${
        variant === 'primary' 
          ? 'bg-[var(--color-gold)] text-[var(--color-midnight)]' 
          : 'border border-[var(--color-border)] text-[var(--color-text-primary)]'
      }`}
    >
      {children}
    </button>
  );
}
```

### File: `app/components/ui/SkipLink.tsx`
```typescript
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
                 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--color-gold)] 
                 focus:text-[var(--color-midnight)] focus:rounded"
    >
      Skip to main content
    </a>
  );
}
```

---

## Phase 7: SEO Optimization

### File: `app/sitemap.ts`
```typescript
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sufipulse.com';

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/releases`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/literary-journal`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    // Add more routes...
  ];
}
```

### File: `app/robots.ts`
```typescript
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/'],
    },
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL}/sitemap.xml`,
  };
}
```

---

## Phase 8: File Upload System

### File: `lib/file-upload.ts`
```typescript
import fs from 'fs';
import path from 'path';
import { generateId } from './database';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export async function saveFile(file: File, folder: string = 'general'): Promise<string> {
  const folderPath = path.join(UPLOAD_DIR, folder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  const ext = file.name.split('.').pop();
  const fileName = `${generateId()}.${ext}`;
  const filePath = path.join(folderPath, fileName);

  const bytes = await file.arrayBuffer();
  fs.writeFileSync(filePath, Buffer.from(bytes));

  return `/uploads/${folder}/${fileName}`;
}

export function deleteFile(filePath: string): boolean {
  const fullPath = path.join(process.cwd(), 'public', filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    return true;
  }
  return false;
}
```

---

## Phase 9: Caching Strategy

### File: `lib/cache.ts`
```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in ms
}

class Cache {
  private store = new Map<string, CacheEntry<any>>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.timestamp + entry.ttl) {
      this.store.delete(key);
      return null;
    }

    return entry.data;
  }

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.store.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

export const cache = new Cache();
```

---

## Phase 10: CI/CD Pipeline

### File: `.github/workflows/ci.yml`
```yaml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
        env:
          DATABASE_URL: file:./.data
          JWT_SECRET: test-secret-for-ci
          JWT_REFRESH_SECRET: test-refresh-secret-for-ci

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to server
        run: |
          # Add your deployment script
          echo "Deploying..."
```

---

## Phase 11: API Documentation

### Install
```bash
npm install -D swagger-ui-dist @types/swagger-ui-dist
```

### File: `app/api/docs/route.ts`
```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  const swaggerSpec = {
    openapi: '3.0.0',
    info: {
      title: 'SufiPulse API',
      version: '1.0.0',
      description: 'Complete API documentation for SufiPulse platform',
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        description: 'Local server',
      },
    ],
    paths: {
      '/api/auth/login': {
        post: {
          summary: 'Login user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 6 },
                  },
                  required: ['email', 'password'],
                },
              },
            },
          },
          responses: {
            '200': { description: 'Login successful' },
            '400': { description: 'Validation error' },
            '401': { description: 'Invalid credentials' },
          },
        },
      },
      // Add more endpoints...
    },
  };

  return NextResponse.json(swaggerSpec);
}
```

---

## Phase 12: Internationalization (Urdu/English)

### Install
```bash
npm install next-intl
```

### File: `app/i18n.ts`
```typescript
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  const locale = 'en'; // Default, can be changed based on user preference

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
```

### File: `app/messages/en.json`
```json
{
  "home": {
    "title": "SufiPulse — Sacred Music & Poetry",
    "subtitle": "Discover Sufi music, poetry, and literary works",
    "latestReleases": "Latest Releases",
    "contributors": "Creative Contributors"
  },
  "nav": {
    "releases": "Releases",
    "literaryJournal": "Literary Journal",
    "about": "About",
    "login": "Login",
    "register": "Register"
  }
}
```

### File: `app/messages/ur.json`
```json
{
  "home": {
    "title": "صوفی پلس — مقدس موسیقی اور شاعری",
    "subtitle": "صوفی موسیقی، شاعری اور ادبی کامات دریافت کریں",
    "latestReleases": "تازہ ترین ریلیزز",
    "contributors": "تخلیقی تعاون کنندگان"
  },
  "nav": {
    "releases": "ریلیزز",
    "literaryJournal": "ادبی جریدہ",
    "about": "تعارف",
    "login": "لاگ ان",
    "register": "رجسٹر"
  }
}
```

---

## Quick Implementation Commands

Run these commands to implement all phases at once:

```bash
# Phase 3: JWT Auth
npm install jose bcryptjs
npm install -D @types/bcryptjs

# Phase 4: Testing
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitejs/plugin-react playwright
npx playwright install

# Phase 5: Sentry
npm install @sentry/nextjs

# Phase 6: Accessibility
npm install -D eslint-plugin-jsx-a11y

# Phase 8: File Upload (already standalone, no deps needed)

# Phase 12: i18n
npm install next-intl
```

---

## Complete File Structure After All Phases

```
sufipulse/
├── .data/                          # File-based database
│   ├── users.json
│   ├── writer_profiles.json
│   └── backups/
├── .github/workflows/
│   └── ci.yml                      # CI/CD pipeline
├── __tests__/
│   ├── setup.ts
│   ├── unit/
│   │   ├── components/
│   │   └── hooks/
│   └── e2e/
│       └── homepage.spec.ts
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── register/route.ts
│   │   │   ├── refresh/route.ts
│   │   │   ├── logout/route.ts
│   │   │   └── me/route.ts
│   │   └── docs/route.ts          # API docs
│   ├── components/
│   │   └── ui/
│   │       ├── ErrorBoundary.tsx
│   │       ├── Skeleton.tsx
│   │       ├── LoadingSpinner.tsx
│   │       ├── AccessibleButton.tsx
│   │       └── SkipLink.tsx
│   ├── messages/
│   │   ├── en.json
│   │   └── ur.json
│   ├── middleware.ts                # Route protection
│   └── layout.tsx
├── lib/
│   ├── database.ts                 # Database engine
│   ├── database-schema.ts          # Type schemas
│   ├── auth.ts                     # JWT authentication
│   ├── cache.ts                    # In-memory cache
│   ├── file-upload.ts              # File uploads
│   └── sentry.ts                   # Error tracking
├── public/uploads/                 # User uploads
├── vitest.config.ts
├── playwright.config.ts
├── sentry.client.config.ts
├── sentry.server.config.ts
├── .env.example
├── .env.development
└── .env.test
```

---

## Testing Everything Works

```bash
# 1. Validate environment
npm run env:validate

# 2. Run unit tests
npm test

# 3. Run E2E tests
npm run test:e2e

# 4. Build production
npm run build

# 5. Start server
npm start
```

---

**All phases documented and ready for implementation!**
