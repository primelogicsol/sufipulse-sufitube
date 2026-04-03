# 🎯 SufiPulse Development - Quick Reference

## ⚡ Start Server
```bash
npm run dev
# Server runs at http://localhost:3000
```

## 🛠️ Essential Commands

| Command | Purpose | When to Use |
|---------|---------|------------|
| `npm run dev` | Start development server | Normal development |
| `npm run dev:clean` | Clear cache + start | If experiencing issues |
| `npm run monitor` | Start + monitor health | Long sessions, production-like |
| `npm run type-check` | Validate TypeScript | Before commits |
| `npm run clean` | Clear all caches | Major issues |
| `npm run kill-port` | Free port 3000 | Port stuck |

## 🚨 Quick Fixes

### Server won't start?
```bash
npm run kill-port
npm run dev:clean
```

### Stale files/caching?
```bash
npm run clean
npm run dev
```

### TypeScript errors?
```bash
npm run type-check
```

### Everything broken?
```bash
taskkill /F /IM node.exe /T
npm install
npm run dev
```

## 📍 Access Points

- **Frontend**: http://localhost:3000
- **API**: http://localhost:5000/api (backend required)
- **Logs**: `dev-server.log` (when monitoring)

## 🔍 Troubleshooting Matrix

| Problem | Cause | Solution |
|---------|-------|----------|
| "Address already in use" | Port 3000 occupied | `npm run kill-port` |
| Page not updating | Stale cache | `npm run dev:clean` |
| Type errors | Build cache issue | `npm run clean` |
| High memory | Server running too long | Restart: `npm run dev` |
| Network errors | Backend not running | Start backend on 5000 |

## 📊 System Status

Check before starting:
```bash
node --version    # Should be v20.11.1+
npm --version     # Should be 10.2.4+
```

## 💾 Key Files

- `.env.local` - Environment variables
- `next.config.mjs` - Build settings
- `package.json` - Scripts and dependencies
- `scripts/start-dev.js` - Smart startup
- `scripts/monitor-dev-server.js` - Health monitor

## ✅ Startup Checklist

- [ ] Terminal is open in project root
- [ ] No error messages in last `npm install`
- [ ] Run `npm run dev`
- [ ] Wait for "✓ Ready in Xms"
- [ ] Open http://localhost:3000
- [ ] See SufiPulse homepage
- [ ] You're ready to code!

## 🎓 Development Workflow

1. Start: `npm run dev`
2. Edit files → Auto-reload (no restart needed)
3. Open browser → See changes
4. Continue editing
5. Stop: `Ctrl+C`

## 📖 Full Docs

- **DEVELOPMENT_GUIDE.md** - Complete setup guide
- **STABILITY_REPORT.md** - Technical details
- **README.md** - Project overview

---
**Last Updated**: April 1, 2026  
**Status**: ✅ STABLE