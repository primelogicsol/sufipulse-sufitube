# SufiPulse CMS Admin Setup Guide

## 🚀 Quick Start

### Step 1: Create Admin Credentials

Go to the admin setup page:
```
http://localhost:3000/admin/setup
```

Click **"Setup Everything"** to create:
- ✅ Admin user account
- ✅ 3 sample releases (2 published, 1 draft)

### Step 2: Login

Go to: `http://localhost:3000/login`

**Credentials:**
- **Email:** `admin@sufipulse.local`
- **Password:** (any password - standalone mode)

### Step 3: Access CMS

After login, go to: `http://localhost:3000/admin/cms-releases`

---

## 📋 Admin Credentials

| Field | Value |
|-------|-------|
| Email | `admin@sufipulse.local` |
| Password | Any password (standalone mode) |
| Role | admin |
| URL | `http://localhost:3000/admin/cms-releases` |

**Note:** In standalone mode, any password is accepted. When you connect to Supabase/backend, implement proper password hashing.

---

## ✨ Sample Releases Included

When you run the quick setup, 3 test releases are created:

### 1. Heart's Whisper (Published)
- **YouTube ID:** LXb3EKWsInQ
- **Status:** Published
- **Views:** 3,500
- **Vocalist:** Fatima Zahra
- **Producer:** Ali Raza

### 2. The Eternal Path (Published)
- **YouTube ID:** kZ7K8nT2mP9
- **Status:** Published
- **Views:** 2,800
- **Vocalist:** Usman Ali
- **Producer:** Hamza Malik

### 3. Celestial Harmonies (Draft)
- **YouTube ID:** nM4L9oQ3rS8
- **Status:** Draft
- **Views:** 4,200
- **Vocalist:** Amina Mirza
- **Producer:** Hassan Raza

---

## 🎯 CMS Features

### Dashboard (`/admin/cms-releases`)
- **View all releases** with status indicators
- **Filter by status:** All, Published, Draft, Archived
- **Quick actions:** Edit, Publish, Unpublish, Archive, Delete
- **Metadata display:** Title, YouTube ID, Release Date

### Create/Edit Release (`/admin/cms-releases/new` or `/admin/cms-releases/[id]`)

#### Basic Information
- Title (required)
- Slug (required) - Auto-generate from title
- YouTube ID (required)
- Description
- Release Date
- Status (draft, in_review, approved, published, unpublished, archived)

#### Media Information
- Duration (seconds & formatted)
- View/Like counts
- Thumbnail URL
- YouTube URL

#### Features
- Enable Lyrics
- Enable Commentary
- Enable Adoption
- Enable Credits
- Enable Sponsors

---

## 🔄 Workflow

### Publishing a Release

1. **Create Release**
   - Fill in basic info, slug, YouTube ID
   - Leave status as "draft"
   - Click "Save Release"

2. **Edit & Review**
   - Add metadata, duration, thumbnails
   - Configure features
   - Click "Save Release"

3. **Publish**
   - Go to release list
   - Click menu (⋮) → "Publish"
   - Release is now visible to public

4. **Unpublish** (if needed)
   - Click menu (⋮) → "Unpublish"
   - Release hidden but data retained

5. **Archive** (for old content)
   - Click menu (⋮) → "Archive"
   - Release hidden from listings

---

## 📊 Data Storage

### Current Setup (Standalone)
- **Storage:** Browser localStorage
- **Persistence:** Per browser/device
- **Limit:** ~5-10MB (depending on browser)

### Release Data Structure

```json
{
  "id": "release_001",
  "title": "Release Title",
  "slug": "release-slug",
  "youtubeId": "LXb3EKWsInQ",
  "description": "Release description",
  "releaseDate": "2025-12-15",
  "durationSeconds": 420,
  "durationFormatted": "7:00",
  "viewCount": 3500,
  "likeCount": 250,
  "status": "published",
  "thumbnailUrl": "https://...",
  "enableLyrics": true,
  "enableCommentary": true,
  "enableAdoption": true,
  "enableCredits": true,
  "vocals": { "name": "Vocalist Name" },
  "producer": { "name": "Producer Name" },
  "writer": { "name": "Writer Name" },
  "createdAt": "2025-12-01T10:00:00Z",
  "updatedAt": "2025-12-01T10:00:00Z",
  "publishedAt": "2025-12-01T10:00:00Z"
}
```

---

## 🔌 API Endpoints

All endpoints require admin authentication.

### List Releases
```bash
GET /api/releases
GET /api/releases?status=published
GET /api/releases?status=draft
```

### Get by YouTube ID
```bash
GET /api/releases?youtubeId=LXb3EKWsInQ
```

### Get by Slug
```bash
GET /api/releases?slug=hearts-whisper
```

### Create Release
```bash
POST /api/releases
Content-Type: application/json

{
  "title": "My Release",
  "slug": "my-release",
  "youtubeId": "LXb3EKWsInQ",
  "description": "...",
  "releaseDate": "2025-12-15",
  "status": "draft"
}
```

### Update Release
```bash
PUT /api/releases/{id}
Content-Type: application/json

{ "status": "published" }
```

### Delete Release
```bash
DELETE /api/releases/{id}
```

---

## 🧪 Testing Checklist

- [ ] Admin setup page loads at `/admin/setup`
- [ ] Can create admin credentials
- [ ] Can login with admin credentials
- [ ] CMS dashboard loads at `/admin/cms-releases`
- [ ] Can view all releases
- [ ] Can filter by status
- [ ] Can create new release
- [ ] Can edit existing release
- [ ] Can publish draft release
- [ ] Can unpublish published release
- [ ] Can archive release
- [ ] Can delete release
- [ ] Released videos display at `/release-detail/[youtubeId]`
- [ ] CMS releases appear before YouTube API fallback

---

## 🔐 Security Notes

### Current (Standalone/Testing)
- No password validation (any password works)
- No encryption
- Anyone with browser access can modify data
- **For testing only**

### Production (When Ready)
1. Implement Supabase authentication
2. Add password hashing (bcrypt)
3. Enable row-level security
4. Add role-based access control
5. Implement audit logging
6. Add API rate limiting
7. Use HTTPS only

---

## 🐛 Troubleshooting

### Admin page not showing in CMS list
- Make sure you're logged in as admin (`user.role === 'admin'`)
- Check browser console for errors
- Clear localStorage and re-setup

### Releases not appearing on page
- Check that status is "published"
- Verify YouTube ID matches the page slug
- Check localStorage in browser DevTools

### Login not working
- In standalone mode, any password works
- Make sure localStorage is enabled
- Try clearing browser cache

---

## 📖 Related Documentation

- [CMS_SETUP.md](./CMS_SETUP.md) - Full CMS system documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [API_DOCS.md](./API_DOCS.md) - Detailed API documentation

---

## 🚀 Next Steps

### Immediate (Testing)
1. ✅ Create admin credentials
2. ✅ Load sample releases
3. ✅ Test CRUD operations
4. ✅ View releases on public page

### Short Term
- [ ] Import your existing releases
- [ ] Test with real YouTube videos
- [ ] Verify metrics collection

### Medium Term
- [ ] Connect Supabase database
- [ ] Implement email notifications
- [ ] Add bulk import/export

### Long Term
- [ ] Advanced scheduling
- [ ] Analytics dashboard
- [ ] Multi-language support
- [ ] Collaboration features

---

**Last Updated:** April 1, 2026  
**Status:** ✅ Ready for Testing
