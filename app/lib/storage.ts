/**
 * Local Storage Service
 * Replaces Supabase with browser localStorage for standalone deployment
 */

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
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
};

class LocalStorageService {
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

  // Authentication
  async register(email: string, password: string, full_name: string): Promise<{ user: User; token: string }> {
    const users = this.getItem<User>(STORAGE_KEYS.USERS);

    if (users.find(u => u.email === email)) {
      throw new Error('Email already exists');
    }

    const user: User = {
      id: this.generateId(),
      email,
      full_name,
      role: 'user',
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
    const users = this.getItem<User>(STORAGE_KEYS.USERS);
    const user = users.find(u => u.email === email);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const token = btoa(JSON.stringify({ userId: user.id, email: user.email }));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify({ user, token }));

    return { user, token };
  }

  getCurrentUser(): { user: User; token: string } | null {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
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
    };

    return keyMap[type] || `sufipulse_${type}`;
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
