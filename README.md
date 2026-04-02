# SufiPulse - Standalone Edition

A complete platform for Sufi poetry, music, and literary content - fully self-contained and ready for deployment anywhere.

## ✨ Features

- **🎵 Music Releases** - Showcase Sufi kalams and vocal performances
- **✍️ Literary Journal** - Publish and manage Sufi literature and poetry
- **👥 Contributor Profiles** - Writers, vocalists, producers, and literary contributors
- **🏢 Studio Partners** - Recording studio collaboration system
- **📝 Content Management** - Submit and manage kalams, sadas, and articles
- **🔐 Authentication** - Local browser-based user system
- **💾 No Database Required** - All data stored in browser localStorage

## 🚀 Quick Start

### Install and Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
# Build optimized production bundle
npm run build

# Start production server
npm start
```

## 📦 Deployment

This is a **completely standalone application** with no external dependencies:

- ✅ No Supabase required
- ✅ No external databases
- ✅ No API keys needed
- ✅ Deploy anywhere

### Deployment Options

1. **Static Export** - Deploy as static HTML/JS/CSS to any hosting
2. **Node.js Server** - Deploy to Vercel, Railway, Render, etc.
3. **Docker Container** - Containerize and deploy to any cloud
4. **Edge Functions** - Deploy to Cloudflare Pages, Netlify, etc.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 📂 Project Structure

```
app/
├── (auth)/              # Authentication pages
├── (public)/            # Public pages (releases, articles, etc.)
├── admin/               # Admin dashboard
├── user/                # User dashboards (writer, vocalist, etc.)
├── components/          # Reusable React components
├── contexts/            # React contexts (Auth, etc.)
├── data/                # Static data files
├── lib/                 # Utilities and services
└── types/               # TypeScript type definitions

backend/                 # Optional Node.js backend (reference)
```

## 🎨 Customization

### Add Releases

Edit `app/data/releases.ts`:

```typescript
export const releases = [
  {
    id: '1',
    slug: 'your-release',
    title: 'Your Release Title',
    // ... more fields
  },
];
```

### Add Articles

Edit `app/data/literary-articles.ts`:

```typescript
export const articles = [
  {
    id: '1',
    slug: 'your-article',
    title: 'Your Article Title',
    // ... more fields
  },
];
```

### Customize Styling

- Design tokens: `app/styles/design-tokens.css`
- Global styles: `app/globals.css`
- Tailwind config: `tailwind.config.ts`

## 🔧 Tech Stack

- **Framework**: Next.js 16 (React 19)
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Rich Text**: React Simple WYSIWYG
- **Video**: React YouTube
- **TypeScript**: Full type safety

## 💾 Data Storage

All data is stored in browser `localStorage`:

- User accounts and authentication
- Profile information
- Submissions (kalams, sadas, articles)
- Partnership proposals

Data persists in the user's browser and doesn't require a backend database.

## 🔐 Authentication

Simple browser-based authentication:

- Registration and login
- Session persistence
- Role-based access (user, admin)
- Profile management

No email verification or OAuth in standalone mode.

## 📱 Responsive Design

Fully responsive across all devices:

- Mobile-first approach
- Tablet optimizations
- Desktop enhancements
- Touch-friendly interfaces

## 🌐 Migration to Full Backend

When ready to scale, migrate to the included backend:

1. Backend code included in `backend/New folder (2)/`
2. PostgreSQL schemas in `backend/.../database/`
3. REST API with Express.js
4. JWT authentication
5. Email verification with Nodemailer

See [DEPLOYMENT.md](./DEPLOYMENT.md) for migration instructions.

## 🤝 Contributing

This is a standalone project. Feel free to:

- Fork and modify for your needs
- Add new features
- Improve the design
- Fix bugs

## 📄 License

Free to use and modify for your purposes.

## 🆘 Support

- **Documentation**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Next.js Docs**: https://nextjs.org/docs
- **Issues**: Check code comments and type definitions

---

Built with ❤️ for the Sufi community
