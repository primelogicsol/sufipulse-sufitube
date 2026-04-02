# SufiPulse - Standalone Deployment Guide

This guide will help you deploy SufiPulse as a completely standalone application without any external dependencies like Supabase or Bolt.

## Features

✅ **Fully Standalone** - No external databases or services required
✅ **Browser Storage** - All data stored locally in browser localStorage
✅ **Static Export Ready** - Can be exported as static HTML/JS/CSS
✅ **Self-Contained** - Deploy anywhere (Vercel, Netlify, AWS S3, etc.)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Development

```bash
npm run dev
```

Visit `http://localhost:3000`

### 3. Build for Production

```bash
npm run build
```

### 4. Start Production Server

```bash
npm start
```

## Deployment Options

### Option 1: Static Export (Recommended for Standalone)

1. Update `next.config.ts`:

```typescript
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
};
```

2. Build static files:

```bash
npm run build
```

3. Deploy the `out` folder to any static hosting:
   - **AWS S3 + CloudFront**
   - **Netlify** - Drag and drop the `out` folder
   - **Vercel** - Connect GitHub repo
   - **GitHub Pages** - Push `out` folder to gh-pages branch
   - **Any web server** - Upload `out` folder contents

### Option 2: Node.js Server

Deploy to any Node.js hosting platform:

```bash
npm run build
npm start
```

Platforms:
- Vercel
- Railway
- Render
- DigitalOcean App Platform
- AWS Elastic Beanstalk

### Option 3: Docker Container

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t sufipulse .
docker run -p 3000:3000 sufipulse
```

## Data Storage

### Local Storage Schema

All data is stored in browser `localStorage`:

- `sufipulse_users` - User accounts
- `sufipulse_current_user` - Active session
- `sufipulse_writer_profiles` - Writer profiles
- `sufipulse_vocalist_profiles` - Vocalist profiles
- `sufipulse_producer_profiles` - Producer profiles
- `sufipulse_literary_profiles` - Literary contributor profiles
- `sufipulse_studio_profiles` - Studio profiles
- `sufipulse_kalams` - Poetry submissions
- `sufipulse_sadas` - Vocal performances
- `sufipulse_articles` - Literary articles
- `sufipulse_partnerships` - Partnership proposals

### Data Persistence

- Data persists in user's browser
- Clearing browser data will reset all content
- Each user's data is isolated to their browser
- No server-side database required

### Exporting Data (Optional)

To allow users to backup their data, you can add export/import functionality:

```javascript
// Export all data
const exportData = () => {
  const data = {};
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('sufipulse_')) {
      data[key] = localStorage.getItem(key);
    }
  });
  return JSON.stringify(data, null, 2);
};

// Import data
const importData = (jsonString) => {
  const data = JSON.parse(jsonString);
  Object.entries(data).forEach(([key, value]) => {
    localStorage.setItem(key, value);
  });
};
```

## Static Content

### Releases

Edit `app/data/releases.ts` to add/modify releases.

### Literary Articles

Edit `app/data/literary-articles.ts` to add/modify articles.

### Custom Content

Add new data files in `app/data/` directory and import them where needed.

## Configuration

### Environment Variables

No environment variables required for standalone operation.

Optional: Create `.env.local` for custom configuration:

```env
NEXT_PUBLIC_SITE_NAME=SufiPulse
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

## Scaling Considerations

### For Larger Deployments

If you need:
- Shared data across users
- Backend API
- Database storage
- User management at scale

Consider:
1. Keep the frontend as-is
2. Swap `app/lib/storage.ts` with API calls to your backend
3. Use the backend files in `backend/New folder (2)/` as reference
4. Deploy backend separately and connect via API

### Migration Path

The backend code is already included in `backend/New folder (2)/`:

1. **Setup Backend:**
   ```bash
   cd backend/New\ folder\ \(2\)
   npm install
   ```

2. **Configure Database:**
   - Use the SQL schemas in `backend/New folder (2)/database/`
   - Set up PostgreSQL
   - Update `backend.env` with connection details

3. **Start Backend:**
   ```bash
   npm run dev
   ```

4. **Connect Frontend:**
   - Update `app/lib/storage.ts` to make API calls instead of localStorage
   - Point to your backend URL

## Security Notes

### For Standalone Version

- ✅ No server-side vulnerabilities
- ✅ No database injection risks
- ✅ Data isolated per user/browser
- ⚠️ Data visible in browser DevTools
- ⚠️ No server-side validation
- ⚠️ Anyone can register

### For Production with Backend

When you migrate to the backend:
- ✅ Implement proper authentication
- ✅ Add server-side validation
- ✅ Use environment variables for secrets
- ✅ Enable HTTPS
- ✅ Add rate limiting
- ✅ Implement CSRF protection

## Support

For issues or questions:
- Check `README.md` for general information
- Review code in `app/` directory
- Consult Next.js documentation: https://nextjs.org/docs

## License

This project is for demonstration purposes. Modify and deploy as needed.
