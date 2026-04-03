# SufiPulse CMS System - Complete Guide

## 📋 Overview

The CMS (Content Management System) is a complete release management solution with:
- ✅ Draft → Review → Approved → Published workflow
- ✅ Full CRUD operations (Create, Read, Update, Delete)
- ✅ Bulk import/upload via CSV
- ✅ Media library for thumbnails, posters, assets
- ✅ Version control and audit logging
- ✅ Role-based access control
- ✅ Multi-language support (Urdu, English, etc.)
- ✅ Song adoption tracking
- ✅ Credits management (artistic, production, literary, technical)
- ✅ Lyrics management with translations
- ✅ Commentary and sponsorship management

---

## 🚀 Getting Started

### 1. Access the CMS Dashboard
Navigate to: **http://localhost:3000/admin/cms**

You'll see four main sections:
- **Releases** - Manage all releases
- **Media Library** - Upload and organize assets
- **Bulk Import** - CSV batch upload
- **Settings** - CMS configuration

### 2. Create a New Release
1. Click **"New Release"** button
2. Fill in basic information:
   - Title (required)
   - Slug (URL-friendly, required)
   - Description
   - YouTube ID
   - Category
   - Duration, Views, Likes
3. Toggle features:
   - Enable Lyrics
   - Enable Commentary
   - Enable Sponsors
   - Enable Song Adoption
   - Enable Credits
   - Show Views/Likes
4. Click **"Save Release"**

### 3. Publish a Release
1. Go to **Releases** page
2. Click on the release you want to publish
3. Click **"Publish"** button
4. Release is now live!

---

## 📊 Database Schema

### Core Tables

#### `releases`
Main release/video records with workflow states
```sql
- id: UUID (Primary Key)
- title: VARCHAR(500)
- slug: VARCHAR(500) UNIQUE
- status: draft|in_review|approved|published|unpublished|archived
- youtube_id: VARCHAR(100)
- duration_formatted: VARCHAR(20)
- view_count: BIGINT
- like_count: INTEGER
- enable_lyrics: BOOLEAN
- enable_commentary: BOOLEAN
- enable_sponsors: BOOLEAN
- enable_adoption: BOOLEAN
- enable_credits: BOOLEAN
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

#### `release_versions`
Version history and snapshots
```sql
- id: UUID
- release_id: UUID (Foreign Key)
- version_number: INTEGER
- snapshot: JSON (Full release data snapshot)
- change_summary: TEXT
- created_at: TIMESTAMPTZ
```

#### `release_credits`
Structured credits by category
```sql
- id: UUID
- release_id: UUID
- category: artistic|production|literary|technical
- credit_type: VARCHAR(100) (e.g., "Lead Vocalist", "Producer")
- names: TEXT[] (Array of names)
- order_index: INTEGER
```

#### `release_lyrics`
Multi-language lyrics and translations
```sql
- id: UUID
- release_id: UUID
- language_code: VARCHAR(10) (e.g., "ur", "en")
- format: urdu|roman_urdu|transliteration|translation
- content: TEXT
```

#### `release_commentary`
Editorial commentary and scholarly reflections
```sql
- id: UUID
- release_id: UUID
- title: VARCHAR(255)
- content: TEXT
- author_id: UUID
- display_order: INTEGER
- is_published: BOOLEAN
```

#### `release_sponsors`
Sponsor information
```sql
- id: UUID
- release_id: UUID
- sponsor_name: VARCHAR(255)
- logo_url: TEXT
- sponsor_link: TEXT
- display_position: INTEGER
```

#### `release_media`
Media assets (video, audio, images, documents)
```sql
- id: UUID
- release_id: UUID
- media_type: video|audio|image|document
- file_url: TEXT
- file_size: BIGINT
- is_primary: BOOLEAN
- display_order: INTEGER
```

#### `release_metadata`
SEO and structured data
```sql
- id: UUID
- release_id: UUID
- seo_title: VARCHAR(255)
- seo_description: TEXT
- seo_keywords: TEXT[]
- og_title: VARCHAR(255)
- og_description: TEXT
- structured_data: JSON
```

#### `bulk_imports`
Batch import tracking
```sql
- id: UUID
- import_name: VARCHAR(255)
- import_type: releases|credits|lyrics|media
- status: pending|processing|completed|failed
- total_items: INTEGER
- successful_items: INTEGER
- failed_items: INTEGER
- error_log: TEXT
```

#### `bulk_import_items`
Individual items in batch imports
```sql
- id: UUID
- bulk_import_id: UUID
- row_number: INTEGER
- data: JSON
- status: pending|processing|success|failed
```

#### `media_library`
Central media asset management
```sql
- id: UUID
- file_name: VARCHAR(255)
- file_url: TEXT
- file_type: VARCHAR(50)
- file_size: BIGINT
- media_category: thumbnail|poster|promotional|document
```

#### `roles` & `permissions`
Role-based access control
```sql
roles:
- id: UUID
- name: VARCHAR(50) UNIQUE
- hierarchy_level: INTEGER
- is_system_role: BOOLEAN

permissions:
- id: UUID
- name: VARCHAR(100)
- resource: VARCHAR(50)
- action: VARCHAR(50)
```

#### `release_actions_log`
Complete audit trail
```sql
- id: UUID
- release_id: UUID
- action: VARCHAR(100)
- action_by: UUID
- action_details: JSON
- created_at: TIMESTAMPTZ
```

---

## 🔄 Workflow States

### Release Status Flow
```
┌─────────┐
│  DRAFT  │
└────┬────┘
     │
     ↓
┌───────────┐
│ IN_REVIEW │
└────┬──────┘
     │
     ├─→ [APPROVED] ──→ [PUBLISHED]
     │
     └─→ [REJECTED]

Published releases can be:
- [UNPUBLISHED] - removed from public view
- [ARCHIVED] - soft delete (recoverable)
```

### CMS Operations Available per Status

| Operation | Draft | Review | Approved | Published | Unpub | Archived |
|-----------|-------|--------|----------|-----------|-------|----------|
| Edit      | ✅    | ✅     | ✅       | ✅        | ✅    | ❌       |
| Publish   | ✅    | ✅     | ✅       | ❌        | ✅    | ❌       |
| Unpublish | ❌    | ❌     | ❌       | ✅        | ❌    | ❌       |
| Archive   | ✅    | ✅     | ✅       | ✅        | ✅    | ❌       |
| Delete    | ✅    | ✅     | ✅       | ❌        | ✅    | ❌       |
| Restore   | ❌    | ❌     | ❌       | ❌        | ❌    | ✅       |

---

## 🎯 Frontend Pages

### Admin Pages

#### `/admin/cms` - CMS Dashboard
- Quick access to all CMS features
- Summary cards for Releases, Media, Bulk Import, Settings
- Navigation hub for content management

#### `/admin/cms/releases` - Release Manager
- List all releases with search/filter
- Status filters: All, Draft, Review, Approved, Published
- Bulk actions: Publish, Unpublish, Archive
- Create new releases

#### `/admin/cms/releases/[id]/edit` - Release Editor
- Full release editing form
- Basic info: Title, Slug, Description
- Media: YouTube ID, Duration, Category
- Features: Toggle lyrics, commentary, sponsors, adoption, credits
- Save and publish options

#### `/admin/cms/media` - Media Library
- Upload thumbnails, posters, promotional images
- File browser and management
- Copy file URLs for use in releases
- Delete and organize media

#### `/admin/cms/bulk-import` - Bulk CSV Import
- Import multiple releases from CSV
- Import credits, lyrics, or media in batch
- Progress tracking
- Error logging and retry

#### `/admin/cms/settings` - CMS Settings
- Global CMS configuration
- Role and permission management
- Default values
- Feature toggles

---

## 📤 Bulk CSV Import Format

### Release Import CSV
```csv
title,slug,youtube_id,category,duration_formatted,status
"Qawwali Journey","qawwali-journey","lJIrF4E69e8","Qawwali","8:45","draft"
"Divine Love","divine-love","LS8qPHGjQZU","Sufi Poetry","12:30","draft"
```

### Credits Import CSV
```csv
release_id,category,credit_type,names
"abc-123","artistic","Lead Vocalist","Nusrat Fateh Ali Khan"
"abc-123","production","Producer","Ahmed Hassan|Hamza Malik"
```

### Lyrics Import CSV
```csv
release_id,language_code,format,content
"abc-123","ur","urdu","یہ لیریکس ہے..."
"abc-123","en","translation","These are the lyrics..."
```

---

## 🔐 Roles & Permissions

### Default Roles
- **Admin** - Full access to all CMS features
- **Editor** - Can create, edit, publish releases
- **Reviewer** - Can review and approve releases
- **Author** - Can only edit own content
- **Viewer** - Read-only access

### Permission Matrix

| Resource | Action | Admin | Editor | Reviewer | Author | Viewer |
|----------|--------|-------|--------|----------|--------|--------|
| Release  | Create | ✅    | ✅     | ❌       | ✅     | ❌     |
| Release  | Read   | ✅    | ✅     | ✅       | ✅     | ✅     |
| Release  | Update | ✅    | ✅     | ❌       | ✅*    | ❌     |
| Release  | Delete | ✅    | ✅     | ❌       | ❌     | ❌     |
| Release  | Publish| ✅    | ✅     | ❌       | ❌     | ❌     |
| Media    | Upload | ✅    | ✅     | ❌       | ❌     | ❌     |
| Settings | Manage | ✅    | ❌     | ❌       | ❌     | ❌     |

*Author can only update own content

---

## 🎬 Public Release Display

### Release Detail Page
**Route:** `/release-detail/[youtube_id]`

Displays:
- YouTube video embed
- Title and description
- Credits (Vocal, Writer, Producer, etc.)
- Lyrics (if enabled) with language selector
- Commentary (if enabled)
- Song adoption tracking (if enabled)
- Sponsor information (if enabled)
- View/Like counts (if enabled)

### Featured Releases
Homepage shows top 3 featured published releases

---

## 💾 TypeScript Types

```typescript
interface Release {
  id: string;
  title: string;
  subtitle?: string;
  slug: string;
  status: 'draft' | 'in_review' | 'approved' | 'published' | 'unpublished' | 'archived';
  youtube_id?: string;
  description?: string;
  category?: string;
  duration_formatted?: string;
  view_count: number;
  like_count: number;
  enable_lyrics: boolean;
  enable_commentary: boolean;
  enable_sponsors: boolean;
  enable_adoption: boolean;
  enable_credits: boolean;
  default_language: string;
  available_languages?: string[];
  created_at: string;
  updated_at: string;
}

interface ReleaseCredit {
  id: string;
  release_id: string;
  category: 'artistic' | 'production' | 'literary' | 'technical';
  credit_type: string;
  names: string[];
  order_index: number;
}
```

---

## 🔧 API Endpoints

### REST API Routes (when backend is enabled)

```
POST   /api/releases              - Create release
GET    /api/releases              - List releases (with filters)
GET    /api/releases/:id          - Get single release
PUT    /api/releases/:id          - Update release
DELETE /api/releases/:id          - Delete release
PATCH  /api/releases/:id/publish  - Publish release
PATCH  /api/releases/:id/archive  - Archive release

POST   /api/media                 - Upload media
GET    /api/media                 - List media library
DELETE /api/media/:id             - Delete media

POST   /api/bulk-import           - Start bulk import
GET    /api/bulk-import/:id       - Get import status
```

---

## 🎨 Frontend Library

### Using the CMS in Components

```typescript
import { 
  getAllReleases, 
  getReleaseBySlug,
  publishRelease,
  createRelease,
  updateRelease,
  deleteRelease
} from '@/lib/supabase';

// Get all published releases
const releases = await getAllReleases({ status: 'published' });

// Get single release
const release = await getReleaseBySlug('qawwali-journey');

// Create new release
const newRelease = await createRelease({
  title: 'New Release',
  slug: 'new-release',
  status: 'draft',
  // ... other fields
});

// Publish release
await publishRelease(releaseId);

// Update release
await updateRelease(releaseId, { title: 'Updated Title' });

// Delete release
await deleteRelease(releaseId);
```

---

## 📝 Common Tasks

### Task 1: Create and Publish a Release
1. Go to `/admin/cms/releases/new`
2. Fill in title, slug, YouTube ID
3. Click "Save Release"
4. Click "Publish" button
5. Check `/release-detail/[youtube_id]` to view live

### Task 2: Import Multiple Releases
1. Prepare CSV file with releases data
2. Go to `/admin/cms/bulk-import`
3. Select file and upload
4. Monitor progress
5. Check CMS for new releases

### Task 3: Add Credits to Release
1. Go to `/admin/cms/releases`
2. Select release and edit
3. Add credits section
4. Specify: Category, Type, Names
5. Save

### Task 4: Add Lyrics
1. Go to `/admin/cms/releases`
2. Edit release
3. Navigate to Lyrics tab
4. Add Urdu, Roman Urdu, Translation
5. Save

### Task 5: Archive Old Release
1. Go to `/admin/cms/releases`
2. Find release to archive
3. Click menu → "Archive"
4. Release remains in database (recoverable)

---

## ⚠️ Important Notes

### Backup Before Major Operations
- Before bulk imports, export current releases
- Keep CSV backups of important data

### Version Control
- Every publish creates a version snapshot
- Can revert to previous versions if needed

### Audit Logging
- All actions logged in `release_actions_log`
- Track who made changes and when

### Multi-language Support
- Default: English
- Add more languages as needed
- Separate lyrics per language

### YouTube Integration
- YouTube ID is the video identifier
- e.g., "lJIrF4E69e8" from https://youtube.com/watch?v=lJIrF4E69e8

---

## 🐛 Troubleshooting

### Release not showing on homepage?
- Check status is "published"
- Ensure `enable_adoption` and `enable_credits` are toggled as needed

### Bulk import failing?
- Verify CSV format matches template
- Check for special characters or encoding issues
- Retry with smaller batch

### YouTube video not embedded?
- Verify YouTube ID is correct
- Check video is not private/deleted
- Confirm URL format: https://youtube.com/watch?v={ID}

### Credits not displaying?
- Ensure `enable_credits` is toggled ON
- Add credits data before publishing
- Check credit format: Category | Type | Names

---

## 📞 Support

For issues or questions about the CMS, check:
1. Database migration files: `/supabase/migrations/`
2. Frontend code: `/app/admin/cms/`
3. Backend code: `/backend/routes/` and `/backend/controllers/`
4. TypeScript types: `/lib/supabase.ts`
