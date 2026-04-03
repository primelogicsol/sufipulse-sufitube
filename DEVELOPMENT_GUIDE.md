# SufiPulse Development Environment - Stability Guide

## Environment Status
- **Node.js**: v20.11.1 ✓
- **npm**: 10.2.4 ✓
- **Next.js**: 14.2.5 ✓
- **TypeScript**: Configured ✓

## Startup Instructions

### Option 1: Quick Start (Recommended)
```powershell
npm run dev
```
This starts the server on `http://localhost:3000` with automatic port specification.

### Option 2: Clean Start (If experiencing issues)
```powershell
npm run dev:clean
```
This clears the `.next` cache before starting.

### Option 3: Stable Managed Start
```powershell
npm run dev:stable
```
This uses the startup script with automatic cleanup and port management.

## Key Improvements Made

### 1. **Environment Configuration** (.env.local)
- Centralized configuration file
- Local-only settings that don't override production
- YouTube API key configured
- Backend API URL set to `http://localhost:5000/api`

### 2. **Enhanced next.config.mjs**
- Explicit port binding
- Static export support for Netlify
- Image optimization disabled for development
- Faster build settings with package import optimization

### 3. **Build Scripts** (package.json)
```json
"dev": "next dev --port 3000"              // Standard dev start
"dev:clean": "rm -rf .next && ..."         // Clean cache then start
"dev:stable": "node scripts/start-dev.js"  // Smart managed start
"build": "next build"                       // Production build
"type-check": "tsc --noEmit"               // TypeScript validation
"clean": "rm -rf .next ..."                 // Clear caches
"kill-port": "npx kill-port 3000"          // Free port 3000
```

### 4. **Startup Script** (scripts/start-dev.js)
- Automatic process cleanup
- Port availability checking
- Build cache clearing
- Graceful shutdown handling
- Error reporting

## Troubleshooting

### Problem: Port 3000 already in use
```powershell
npm run kill-port
npm run dev
```

### Problem: Stale cache causing issues
```powershell
npm run clean
npm run dev
```

### Problem: TypeScript errors
```powershell
npm run type-check
```

### Problem: Full environment reset
```powershell
# 1. Kill processes
taskkill /F /IM node.exe /T

# 2. Clean everything
npm run clean

# 3. Reinstall dependencies
npm install

# 4. Start fresh
npm run dev
```

## Keeping the Server Stable

### Memory Management
- Next.js development server uses ~150-200MB RAM
- Monitor with: `Get-Process node | Measure-Object -Property WorkingSet -Sum`

### Port Management
The server uses port 3000 exclusively:
- Frontend: http://localhost:3000

### Auto-Reload
- Any file changes automatically trigger reload
- TypeScript compilation errors show in browser
- No need to restart for code changes

## Development Workflow

1. **Start the server** once at the beginning of your session
2. **Edit files** in your IDE - changes auto-reload
3. **Check browser** at http://localhost:3000
4. **Continue editing** - server stays running

## Stopping the Server
Simply press `Ctrl+C` in the terminal running the dev server.

## Performance Tips

1. **Use clean mode occasionally**: `npm run dev:clean`
2. **Monitor memory**: Keep eye on console output
3. **Check TypeScript**: Run `npm run type-check` before commits
4. **Restart on errors**: If unresponsive, stop and restart

## Environment Variables

### Configured (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_YOUTUBE_API_KEY=AIzaSyCw34bUCxl_8S5R8I-380YyFOLDqpWL-R4
```

### Optional (for backend)
```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-key>
```

## Status Indicators

✓ **Green indicators** mean everything is working
- TypeScript compilation successful
- No build errors
- Port available
- Dependencies installed

If you see errors, they appear in:
1. Terminal (build/runtime errors)
2. Browser console (client-side errors)
3. Browser app (UI errors with stack trace)