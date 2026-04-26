/**
 * Local Storage Service
 * Replaces Supabase with browser localStorage for standalone deployment
 */

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  assigned_roles?: string[];
  is_verified: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  profile_status: string;
  created_at: string;
  [key: string]: any;
}

const STORAGE_KEYS = {
  USERS: 'sufipulse_users',
  CURRENT_USER: 'sufipulse_current_user',
  WRITER_PROFILES: 'sufipulse_writer_profiles',
  VOCALIST_PROFILES: 'sufipulse_vocalist_profiles',
  PRODUCER_PROFILES: 'sufipulse_producer_profiles',
  LITERARY_PROFILES: 'sufipulse_literary_profiles',
  STUDIO_PROFILES: 'sufipulse_studio_profiles',
  KALAMS: 'sufipulse_kalams',
  SADAS: 'sufipulse_sadas',
  ARTICLES: 'sufipulse_articles',
  PARTNERSHIPS: 'sufipulse_partnerships',
  SONG_ADOPTIONS: 'sufipulse_song_adoptions',
  SONG_ADOPTION_SPONSORS: 'sufipulse_song_adoption_sponsors',
  SONG_ADOPTION_PACKAGES: 'sufipulse_song_adoption_packages',
  SONG_ADOPTION_GOOGLE_ADS: 'sufipulse_song_adoption_google_ads',
  SONG_ADOPTION_EVENTS: 'sufipulse_song_adoption_events',
  PAYMENTS: 'sufipulse_payments',
};

class LocalStorageService {
  private readonly DEFAULT_ADMIN_EMAIL = 'admin@sufipulse.local';
  private readonly PROMOTED_ADMIN_EMAILS: string[] = ['fk.envcal@gmail.com'];
  private readonly CONTRIBUTOR_ROLES = ['writer', 'vocalist', 'producer', 'literary', 'studio'];

  private getItem<T>(key: string): T[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private setItem<T>(key: string, data: T[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(data));
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private ensureDefaultAdmin(users: User[]): User[] {
    // Ensure the hard-coded default admin account exists
    const adminExists = users.some(
      (u) => this.normalizeEmail(u.email) === this.DEFAULT_ADMIN_EMAIL
    );

    if (!adminExists) {
      users.push({
        id: this.generateId(),
        email: this.DEFAULT_ADMIN_EMAIL,
        full_name: 'Admin User',
        role: 'admin',
        assigned_roles: ['admin', ...this.CONTRIBUTOR_ROLES],
        is_verified: true,
        created_at: new Date().toISOString(),
      });
    }

    // Promote known admin emails — create them if missing, elevate if existing
    for (const adminEmail of this.PROMOTED_ADMIN_EMAILS) {
      const normalizedTarget = this.normalizeEmail(adminEmail);
      const existing = users.find((u) => this.normalizeEmail(u.email) === normalizedTarget);
      if (existing) {
        if (existing.role !== 'admin') {
          existing.role = 'admin';
        }
        if (!Array.isArray(existing.assigned_roles) || !existing.assigned_roles.includes('admin')) {
          existing.assigned_roles = ['admin', ...this.CONTRIBUTOR_ROLES];
        }
      } else {
        users.push({
          id: this.generateId(),
          email: normalizedTarget,
          full_name: 'Fayaz',
          role: 'admin',
          assigned_roles: ['admin', ...this.CONTRIBUTOR_ROLES],
          is_verified: true,
          created_at: new Date().toISOString(),
        });
      }
    }

    return users;
  }

  /**
   * Seeds demo contributor accounts on first run.
   * Passwords are not validated in standalone mode — any non-empty string works.
   * Credentials: fk.envcal@gmail.com / fayaz123  (Admin)
   *              writer@sufipulse.local / demo123
   *              vocalist@sufipulse.local / demo123
   *              producer@sufipulse.local / demo123
   */
  private ensureDemoContributors(): void {
    let users = this.getItem<User>(STORAGE_KEYS.USERS);

    const demos: Array<{
      email: string;
      full_name: string;
      role: string;
      profileKey: string;
      profileData: Record<string, any>;
    }> = [
      {
        email: 'writer@sufipulse.local',
        full_name: 'Demo Writer',
        role: 'writer',
        profileKey: STORAGE_KEYS.WRITER_PROFILES,
        profileData: {
          full_name: 'Demo Writer',
          pen_name: 'Al-Qalam',
          email: 'writer@sufipulse.local',
          country: 'Pakistan',
          city: 'Lahore',
          years_experience: '5',
          primary_languages: ['Urdu', 'Punjabi'],
          writing_styles: ['Ghazal', 'Kalam'],
          literary_background: 'Classical Sufi poetry tradition',
          thematic_focus: 'Divine love and spiritual journey',
          sample_kalam: 'Demo sample kalam text.',
          profile_status: 'approved',
          revision_acknowledged: true,
          institutional_acknowledged: true,
        },
      },
      {
        email: 'vocalist@sufipulse.local',
        full_name: 'Demo Vocalist',
        role: 'vocalist',
        profileKey: STORAGE_KEYS.VOCALIST_PROFILES,
        profileData: {
          full_name: 'Demo Vocalist',
          performance_name: 'Al-Sada',
          email: 'vocalist@sufipulse.local',
          country: 'Pakistan',
          city: 'Karachi',
          years_experience: '7',
          vocal_range: 'Tenor',
          performance_styles: ['Qawwali', 'Classical'],
          languages_performed: ['Urdu', 'Punjabi'],
          musical_training: 'Traditional Ustadh-shagird lineage',
          sample_link: 'https://example.com/demo-vocal',
          profile_status: 'approved',
          status: 'approved',
          worked_in_studio: true,
          willing_editorial_approval: true,
          accept_producer_coordination: true,
          accept_framework: true,
        },
      },
      {
        email: 'producer@sufipulse.local',
        full_name: 'Demo Producer',
        role: 'producer',
        profileKey: STORAGE_KEYS.PRODUCER_PROFILES,
        profileData: {
          full_name: 'Demo Producer',
          professional_name: 'Al-Naghma',
          email: 'producer@sufipulse.local',
          country: 'Pakistan',
          city: 'Islamabad',
          years_experience: '8',
          primary_production_focus: ['Sufi', 'Classical'],
          primary_tools: 'Logic Pro, Ableton Live',
          musical_background: 'Classical and contemporary fusion',
          portfolio_link: 'https://example.com/demo-producer',
          profile_status: 'approved',
          worked_structured_production: true,
          willing_defined_sequence: true,
          acknowledge_centralized_control: true,
          accept_framework: true,
        },
      },
      {
        email: 'literary@sufipulse.local',
        full_name: 'Demo Literary',
        role: 'literary',
        profileKey: STORAGE_KEYS.LITERARY_PROFILES,
        profileData: {
          full_name: 'Demo Literary Contributor',
          professional_name: 'Al-Tahreer',
          email: 'literary@sufipulse.local',
          country: 'Pakistan',
          city: 'Peshawar',
          years_experience: '6',
          writing_focus: ['Commentary', 'Research', 'Essay'],
          languages: ['Urdu', 'English', 'Arabic'],
          background: 'Academic background in Islamic studies and Sufi philosophy',
          portfolio_link: 'https://example.com/demo-literary',
          profile_status: 'approved',
          worked_editorial_process: true,
          willing_review_process: true,
          acknowledge_editorial_control: true,
          accept_framework: true,
        },
      },
    ];

    for (const demo of demos) {
      const normalizedEmail = this.normalizeEmail(demo.email);
      const existingUser = users.find(u => this.normalizeEmail(u.email) === normalizedEmail);

      let userId: string;
      if (!existingUser) {
        userId = this.generateId();
        users.push({
          id: userId,
          email: normalizedEmail,
          full_name: demo.full_name,
          role: demo.role,
          assigned_roles: [demo.role],
          is_verified: true,
          created_at: new Date(0).toISOString(), // epoch → always sorts as oldest
        });
        this.setItem(STORAGE_KEYS.USERS, users);
      } else {
        userId = existingUser.id;
        // Always keep demo accounts on their intended role (handles role changes between seeding runs)
        // Never overwrite promoted admin emails
        const isProtected =
          existingUser.email === this.normalizeEmail(this.DEFAULT_ADMIN_EMAIL) ||
          this.PROMOTED_ADMIN_EMAILS.map(e => this.normalizeEmail(e)).includes(existingUser.email);
        if (existingUser.role !== demo.role && !isProtected) {
          existingUser.role = demo.role;
          existingUser.assigned_roles = [demo.role];
          this.setItem(STORAGE_KEYS.USERS, users);
          // Also update the active session if this user is currently logged in
          if (typeof window !== 'undefined') {
            const sessionRaw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
            if (sessionRaw) {
              try {
                const session = JSON.parse(sessionRaw);
                if (session?.user?.id === userId) {
                  session.user.role = demo.role;
                  session.user.assigned_roles = [demo.role];
                  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(session));
                }
              } catch {}
            }
          }
        }
      }

      // Seed approved profile if none exists for this user
      const profiles = this.getItem<any>(demo.profileKey);
      const profileExists = profiles.some((p: any) => p.user_id === userId);
      if (!profileExists) {
        profiles.push({
          id: this.generateId(),
          user_id: userId,
          created_at: new Date(0).toISOString(),
          submitted_at: new Date(0).toISOString(),
          ...demo.profileData,
        });
        this.setItem(demo.profileKey, profiles);
      }
    }
  }

  // Authentication
  async register(email: string, password: string, full_name: string): Promise<{ user: User; token: string }> {
    const users = this.getItem<User>(STORAGE_KEYS.USERS);
    const normalizedEmail = this.normalizeEmail(email);

    if (users.find(u => this.normalizeEmail(u.email) === normalizedEmail)) {
      throw new Error('Email already exists');
    }

    // First registered user in standalone mode becomes admin by default for control panel access.
    const existingAdmin = users.some((u) => u.role === 'admin');
    const userRole = existingAdmin ? 'user' : 'admin';

    const user: User = {
      id: this.generateId(),
      email: normalizedEmail,
      full_name,
      role: userRole,
      assigned_roles: userRole === 'admin' ? ['admin', ...this.CONTRIBUTOR_ROLES] : [...this.CONTRIBUTOR_ROLES],
      is_verified: true, // Auto-verify for standalone version
      created_at: new Date().toISOString(),
    };

    users.push(user);
    this.setItem(STORAGE_KEYS.USERS, users);

    const token = btoa(JSON.stringify({ userId: user.id, email: user.email }));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify({ user, token }));

    return { user, token };
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const normalizedEmail = this.normalizeEmail(email);
    let users = this.getItem<User>(STORAGE_KEYS.USERS);

    users = this.ensureDefaultAdmin(users);
    this.setItem(STORAGE_KEYS.USERS, users);
    this.ensureDemoContributors();
    // Reload users after demo seeding
    users = this.getItem<User>(STORAGE_KEYS.USERS);

    const user = users.find(u => this.normalizeEmail(u.email) === normalizedEmail);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Backward compatibility for existing user records
    if (!Array.isArray(user.assigned_roles) || user.assigned_roles.length === 0) {
      user.assigned_roles = user.role === 'admin' ? ['admin', ...this.CONTRIBUTOR_ROLES] : [...this.CONTRIBUTOR_ROLES];
      this.setItem(STORAGE_KEYS.USERS, users);
    }

    // Keep legacy role checks compatible with assigned role model
    const hasAdminRole = user.assigned_roles.includes('admin');
    if (hasAdminRole && user.role !== 'admin') {
      user.role = 'admin';
      this.setItem(STORAGE_KEYS.USERS, users);
    }

    const token = btoa(JSON.stringify({ userId: user.id, email: user.email }));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify({ user, token }));

    return { user, token };
  }

  getCurrentUser(): { user: User; token: string } | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return null;
    // Ensure demo roles are synced, then re-read in case CURRENT_USER was updated
    this.ensureDemoContributors();
    const updated = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return updated ? JSON.parse(updated) : null;
  }

  logout(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }

  // Profile Operations
  async createProfile(type: string, data: any): Promise<Profile> {
    const key = this.getStorageKey(type);
    const profiles = this.getItem<Profile>(key);
    const currentUser = this.getCurrentUser();

    if (!currentUser) {
      throw new Error('Not authenticated');
    }

    const profile: Profile = {
      id: this.generateId(),
      user_id: currentUser.user.id,
      profile_status: 'pending',
      created_at: new Date().toISOString(),
      ...data,
    };

    profiles.push(profile);
    this.setItem(key, profiles);

    return profile;
  }

  async getProfile(type: string, userId: string): Promise<Profile | null> {
    const key = this.getStorageKey(type);
    const profiles = this.getItem<Profile>(key);
    return profiles.find(p => p.user_id === userId) || null;
  }

  async updateProfile(type: string, profileId: string, data: any): Promise<Profile> {
    const key = this.getStorageKey(type);
    const profiles = this.getItem<Profile>(key);
    const index = profiles.findIndex(p => p.id === profileId);

    if (index === -1) {
      throw new Error('Profile not found');
    }

    profiles[index] = { ...profiles[index], ...data };
    this.setItem(key, profiles);

    return profiles[index];
  }

  // Generic CRUD operations
  async create(type: string, data: any): Promise<any> {
    const key = this.getStorageKey(type);
    const items = this.getItem<any>(key);
    const currentUser = this.getCurrentUser();

    const item = {
      id: this.generateId(),
      user_id: currentUser?.user.id,
      created_at: new Date().toISOString(),
      ...data,
    };

    items.push(item);
    this.setItem(key, items);

    return item;
  }

  async getAll(type: string, filter?: any): Promise<any[]> {
    const key = this.getStorageKey(type);
    let items = this.getItem<any>(key);

    if (filter) {
      items = items.filter(item => {
        return Object.keys(filter).every(key => item[key] === filter[key]);
      });
    }

    return items;
  }

  async getById(type: string, id: string): Promise<any | null> {
    const key = this.getStorageKey(type);
    const items = this.getItem<any>(key);
    return items.find(item => item.id === id) || null;
  }

  async update(type: string, id: string, data: any): Promise<any> {
    const key = this.getStorageKey(type);
    const items = this.getItem<any>(key);
    const index = items.findIndex(item => item.id === id);

    if (index === -1) {
      throw new Error('Item not found');
    }

    items[index] = { ...items[index], ...data };
    this.setItem(key, items);

    return items[index];
  }

  async delete(type: string, id: string): Promise<void> {
    const key = this.getStorageKey(type);
    const items = this.getItem<any>(key);
    const filtered = items.filter(item => item.id !== id);
    this.setItem(key, filtered);
  }

  private getStorageKey(type: string): string {
    const keyMap: Record<string, string> = {
      writer: STORAGE_KEYS.WRITER_PROFILES,
      vocalist: STORAGE_KEYS.VOCALIST_PROFILES,
      producer: STORAGE_KEYS.PRODUCER_PROFILES,
      literary: STORAGE_KEYS.LITERARY_PROFILES,
      studio: STORAGE_KEYS.STUDIO_PROFILES,
      kalam: STORAGE_KEYS.KALAMS,
      sada: STORAGE_KEYS.SADAS,
      article: STORAGE_KEYS.ARTICLES,
      partnership: STORAGE_KEYS.PARTNERSHIPS,
      song_adoption: STORAGE_KEYS.SONG_ADOPTIONS,
      song_adoption_sponsor: STORAGE_KEYS.SONG_ADOPTION_SPONSORS,
      song_adoption_package: STORAGE_KEYS.SONG_ADOPTION_PACKAGES,
      song_adoption_google_ads: STORAGE_KEYS.SONG_ADOPTION_GOOGLE_ADS,
      song_adoption_event: STORAGE_KEYS.SONG_ADOPTION_EVENTS,
      payment: STORAGE_KEYS.PAYMENTS,
    };

    return keyMap[type] || `sufipulse_${type}`;
  }

  // Adoption-specific methods
  async createSongAdoption(data: any): Promise<any> {
    return this.create('song_adoption', data);
  }

  async getSongAdoptions(filter?: any): Promise<any[]> {
    return this.getAll('song_adoption', filter);
  }

  async getSongAdoptionById(id: string): Promise<any | null> {
    return this.getById('song_adoption', id);
  }

  async updateSongAdoption(id: string, data: any): Promise<any> {
    return this.update('song_adoption', id, data);
  }

  async createSongAdoptionSponsor(data: any): Promise<any> {
    return this.create('song_adoption_sponsor', data);
  }

  async getSongAdoptionPackages(): Promise<any[]> {
    return this.getAll('song_adoption_package');
  }

  async createSongAdoptionEvent(data: any): Promise<any> {
    return this.create('song_adoption_event', data);
  }

  async createPayment(data: any): Promise<any> {
    return this.create('payment', data);
  }

  async getPayments(filter?: any): Promise<any[]> {
    return this.getAll('payment', filter);
  }

  // Initialize default packages if not exist
  async initializeAdoptionPackages(): Promise<void> {
    const existing = await this.getSongAdoptionPackages();
    if (existing.length > 0) return;

    const packages = [
      {
        package_name: 'Quick Boost',
        description: 'Short visibility push and early testing — ideal for first-time sponsors',
        currency: 'USD',
        amount: 39,
        estimated_impressions_min: 500,
        estimated_impressions_max: 3000,
        duration_days: 4,
        regions_targeted: ['Local'],
        reporting_level: 'Basic',
        is_active: true,
        sort_order: 1,
      },
      {
        package_name: 'Starter Reach',
        description: 'Focused promotional push for one kalam with community engagement',
        currency: 'USD',
        amount: 75,
        estimated_impressions_min: 3000,
        estimated_impressions_max: 10000,
        duration_days: 7,
        regions_targeted: ['Regional'],
        reporting_level: 'Basic',
        is_active: true,
        sort_order: 2,
      },
      {
        package_name: 'Balanced Campaign',
        description: 'Stronger reach, better audience learning and diaspora discovery',
        currency: 'USD',
        amount: 199,
        estimated_impressions_min: 10000,
        estimated_impressions_max: 40000,
        duration_days: 14,
        regions_targeted: ['Regional', 'Diaspora'],
        reporting_level: 'Standard',
        is_active: true,
        sort_order: 3,
      },
      {
        package_name: 'Optimal Reach',
        description: 'Sustained promotion, wider discovery and stronger performance data',
        currency: 'USD',
        amount: 500,
        estimated_impressions_min: 50000,
        estimated_impressions_max: 150000,
        duration_days: 21,
        regions_targeted: ['Global'],
        reporting_level: 'Premium',
        is_active: true,
        sort_order: 4,
      },
    ];

    for (const pkg of packages) {
      await this.create('song_adoption_package', pkg);
    }
  }

  // Clear all data (for testing)
  clearAll(): void {
    if (typeof window === 'undefined') return;
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
}

export const storage = new LocalStorageService();
