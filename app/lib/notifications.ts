/**
 * In-app notification service (localStorage-backed for standalone mode).
 * Also fires email notifications via /api/notify when SMTP is configured.
 */

export type NotificationEvent =
  | 'application_received'
  | 'under_review'
  | 'approved'
  | 'revision_requested'
  | 'rejected'
  | 'kalam_approved'
  | 'kalam_revision'
  | 'kalam_submitted'
  | 'sada_submitted'
  | 'article_submitted'
  | 'assignment_received'
  | 'royalty_paid'
  | 'session_scheduled'
  | 'session_completed'
  | 'access_code_issued';

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  event: NotificationEvent;
  read: boolean;
  created_at: string;
  action_url?: string;
}

const NOTIFICATIONS_KEY = 'sufipulse_notifications';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ─── In-app notifications ────────────────────────────────────────────────────

export function createNotification(params: {
  user_id: string;
  title: string;
  message: string;
  event: NotificationEvent;
  action_url?: string;
}): void {
  if (typeof window === 'undefined') return;
  const stored: AppNotification[] = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]');
  const notification: AppNotification = {
    id: generateId(),
    user_id: params.user_id,
    title: params.title,
    message: params.message,
    event: params.event,
    read: false,
    created_at: new Date().toISOString(),
    action_url: params.action_url,
  };
  stored.push(notification);
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(stored));
}

export function getUserNotifications(user_id: string): AppNotification[] {
  if (typeof window === 'undefined') return [];
  const stored: AppNotification[] = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]');
  return stored.filter(n => n.user_id === user_id).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function markNotificationRead(id: string): void {
  if (typeof window === 'undefined') return;
  const stored: AppNotification[] = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]');
  const updated = stored.map(n => n.id === id ? { ...n, read: true } : n);
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
}

export function markAllNotificationsRead(user_id: string): void {
  if (typeof window === 'undefined') return;
  const stored: AppNotification[] = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]');
  const updated = stored.map(n => n.user_id === user_id ? { ...n, read: true } : n);
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
}

// ─── Email + Notification helper ─────────────────────────────────────────────

export type ContributorRole = 'writer' | 'vocalist' | 'producer' | 'literary' | 'studio';

interface StatusChangeParams {
  /** applicant's user_id in localStorage (may be undefined for API-only profiles) */
  user_id?: string;
  /** applicant's email — used to send the email */
  email: string;
  /** applicant's display name */
  name: string;
  role: ContributorRole;
  status: NotificationEvent;
  /** submission reference or ID */
  reference?: string;
}

const ROLE_LABELS: Record<ContributorRole, { title: string; slug: string }> = {
  writer:   { title: 'Ahl-e-Qalam (Writer)',                slug: 'writer' },
  vocalist: { title: 'Ahl-e-Sada (Vocalist)',               slug: 'vocalist' },
  producer: { title: 'Ahl-e-Naghma (Producer)',             slug: 'producer' },
  literary: { title: 'Ahl-e-Tahreer (Literary Contributor)', slug: 'literary-contributor' },
  studio:   { title: 'Studio Engineer / Partner',            slug: 'studio' },
};

function buildNotificationContent(event: NotificationEvent, role: ContributorRole, name: string): {
  title: string; message: string; action_url?: string;
} {
  const label = ROLE_LABELS[role];
  const dashboardPath = `/user/${label.slug}/dashboard`;
  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  switch (event) {
    case 'application_received':
      return {
        title: 'Application Received',
        message: `Thank you, ${name}. Your application as ${label.title} has been received and added to the review queue. You will be notified of any updates here and by email. Review period: 14–21 days.`,
        action_url: `${appUrl}${dashboardPath}`,
      };
    case 'under_review':
      return {
        title: 'Application Under Review',
        message: `Your ${label.title} application is now under active review by our editorial team. You will receive a decision notification within 5–7 days.`,
        action_url: `${appUrl}${dashboardPath}`,
      };
    case 'approved':
      return {
        title: '🎉 Application Approved',
        message: `Congratulations, ${name}! Your application as ${label.title} has been approved. You can now access your contributor dashboard using your registered email and password. Sign in at ${appUrl}/login and navigate to your dashboard.`,
        action_url: `${appUrl}${dashboardPath}`,
      };
    case 'revision_requested':
      return {
        title: 'Revision Requested',
        message: `Your ${label.title} application needs some revisions before it can be approved. Please sign in to your dashboard, review the admin notes, update your profile, and resubmit.`,
        action_url: `${appUrl}/user/${label.slug}/profile`,
      };
    case 'rejected':
      return {
        title: 'Application Not Accepted',
        message: `After careful review, your application as ${label.title} was not accepted at this time. You may re-apply after 90 days. If you have questions, please contact our editorial team.`,
      };
    case 'kalam_approved':
      return {
        title: 'Kalam Approved',
        message: `Great news, ${name}! Your submitted kalam has been approved by the editorial team and will proceed to the next production stage.`,
        action_url: `${appUrl}/user/${label.slug}/dashboard`,
      };
    case 'kalam_revision':
      return {
        title: 'Kalam Revision Requested',
        message: `The editorial team has reviewed your kalam and requested revisions. Please sign in to your dashboard, review the notes, and resubmit.`,
        action_url: `${appUrl}/user/${label.slug}/dashboard`,
      };
    case 'assignment_received':
      return {
        title: 'New Production Assignment',
        message: `You have been assigned to a new production project. Sign in to your dashboard to view the details and timeline.`,
        action_url: `${appUrl}/user/${label.slug}/dashboard`,
      };
    case 'royalty_paid':
      return {
        title: 'Royalty Payment Processed',
        message: `A royalty payment has been processed for your contribution. Please check your registered payment details for the disbursement.`,
        action_url: `${appUrl}/user/${label.slug}/dashboard`,
      };
    case 'session_scheduled':
      return {
        title: 'Studio Session Scheduled',
        message: `Your studio session has been scheduled. Sign in to your dashboard to view the date, time, and studio details.`,
        action_url: `${appUrl}/user/${label.slug}/dashboard`,
      };
    case 'session_completed':
      return {
        title: 'Studio Session Completed',
        message: `Your studio session has been marked as completed by the admin team. Thank you for your contribution to SufiPulse.`,
        action_url: `${appUrl}/user/${label.slug}/dashboard`,
      };
    case 'access_code_issued':
      return {
        title: 'Studio Access Code Issued',
        message: `Your request for a Studio Session reference code has been approved. Your access code is ready — sign in to your dashboard to retrieve it.`,
        action_url: `${appUrl}/user/${label.slug}/dashboard`,
      };
    default:
      return { title: 'Status Update', message: 'Your status has been updated. Sign in to your dashboard for details.' };
  }
}

/**
 * Call this from admin pages whenever a contributor's profile status changes.
 * Creates an in-app notification AND fires an email via /api/notify.
 */
export async function notifyStatusChange(params: StatusChangeParams): Promise<void> {
  const { user_id, email, name, role, status, reference } = params;
  const content = buildNotificationContent(status, role, name);

  // 1. In-app notification (only when we have a user_id)
  if (user_id) {
    createNotification({
      user_id,
      title: content.title,
      message: content.message,
      event: status,
      action_url: content.action_url,
    });
  }

  // 2. Email notification (fire-and-forget; silently fails if SMTP not configured)
  try {
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject: `SufiPulse – ${content.title}`,
        name,
        role,
        event: status,
        reference,
        message: content.message,
        action_url: content.action_url,
      }),
    });
  } catch {
    // Email failure must not interrupt admin workflow
  }
}

/**
 * Call this when a contributor submits a new application form.
 */
export async function notifyApplicationReceived(params: {
  user_id?: string;
  email: string;
  name: string;
  role: ContributorRole;
  reference?: string;
}): Promise<void> {
  return notifyStatusChange({ ...params, status: 'application_received' });
}

// ─── Admin Notifications ─────────────────────────────────────────────────────

const ADMIN_NOTIFICATIONS_KEY = 'sufipulse_admin_notifications';

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  event: string;
  from_role?: string;
  from_name?: string;
  read: boolean;
  created_at: string;
  action_url?: string;
}

function createAdminNotification(params: Omit<AdminNotification, 'id' | 'read' | 'created_at'>): void {
  if (typeof window === 'undefined') return;
  const stored: AdminNotification[] = JSON.parse(localStorage.getItem(ADMIN_NOTIFICATIONS_KEY) || '[]');
  stored.push({ id: generateId(), ...params, read: false, created_at: new Date().toISOString() });
  localStorage.setItem(ADMIN_NOTIFICATIONS_KEY, JSON.stringify(stored));
}

export function getAdminNotifications(): AdminNotification[] {
  if (typeof window === 'undefined') return [];
  const stored: AdminNotification[] = JSON.parse(localStorage.getItem(ADMIN_NOTIFICATIONS_KEY) || '[]');
  return stored.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function markAdminNotificationRead(id: string): void {
  if (typeof window === 'undefined') return;
  const stored: AdminNotification[] = JSON.parse(localStorage.getItem(ADMIN_NOTIFICATIONS_KEY) || '[]');
  localStorage.setItem(ADMIN_NOTIFICATIONS_KEY, JSON.stringify(stored.map(n => n.id === id ? { ...n, read: true } : n)));
}

export function markAllAdminNotificationsRead(): void {
  if (typeof window === 'undefined') return;
  const stored: AdminNotification[] = JSON.parse(localStorage.getItem(ADMIN_NOTIFICATIONS_KEY) || '[]');
  localStorage.setItem(ADMIN_NOTIFICATIONS_KEY, JSON.stringify(stored.map(n => ({ ...n, read: true }))));
}

/**
 * Sends a notification to the admin — in-app inbox + optional email.
 * Call from contributor dashboards when they submit content.
 */
export async function notifyAdmin(params: {
  title: string;
  message: string;
  event: string;
  from_role?: string;
  from_name?: string;
  action_url?: string;
  reference?: string;
}): Promise<void> {
  const { title, message, event, from_role, from_name, action_url, reference } = params;

  // 1. In-app admin notification
  createAdminNotification({ title, message, event, from_role, from_name, action_url });

  // 2. Email to admin (only if NEXT_PUBLIC_ADMIN_EMAIL is set)
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  if (!adminEmail) return;

  try {
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: adminEmail,
        subject: `SufiPulse Admin – ${title}`,
        name: 'Admin',
        role: 'admin',
        event,
        reference,
        message,
        action_url,
      }),
    });
  } catch {}
}

// ─── Storage lookup helpers ───────────────────────────────────────────────────

/**
 * Look up a user by user_id from localStorage sufipulse_users.
 */
export function lookupUserFromStorage(user_id: string): { email: string; name: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const users: any[] = JSON.parse(localStorage.getItem('sufipulse_users') || '[]');
    const found = users.find(u => u.id === user_id);
    if (!found) return null;
    return { email: found.email, name: found.full_name || found.email };
  } catch { return null; }
}

/**
 * Look up a contributor profile by display name across a given role's profile storage.
 * Returns { user_id?, email?, name } or null if not found.
 */
export function lookupProfileByName(
  profileType: string,
  name: string
): { user_id?: string; email?: string; name: string } | null {
  if (typeof window === 'undefined' || !name) return null;
  const keyMap: Record<string, string> = {
    vocalist: 'sufipulse_vocalist_profiles',
    writer:   'sufipulse_writer_profiles',
    producer: 'sufipulse_producer_profiles',
    literary: 'sufipulse_literary_profiles',
    studio:   'sufipulse_studio_profiles',
  };
  const key = keyMap[profileType];
  if (!key) return null;
  try {
    const profiles: any[] = JSON.parse(localStorage.getItem(key) || '[]');
    const nameLower = name.trim().toLowerCase();
    const found = profiles.find(p =>
      (p.full_name || '').toLowerCase().includes(nameLower) ||
      (p.pen_name || '').toLowerCase().includes(nameLower) ||
      (p.professional_name || '').toLowerCase().includes(nameLower) ||
      (p.performance_name || '').toLowerCase().includes(nameLower) ||
      (p.studio_name || '').toLowerCase().includes(nameLower)
    );
    if (!found) return null;
    return {
      user_id: found.user_id,
      email: found.email,
      name: found.pen_name || found.performance_name || found.professional_name || found.studio_name || found.full_name || name,
    };
  } catch { return null; }
}

// ─── Status → Event mappers ───────────────────────────────────────────────────

/**
 * Map raw kalam status strings ('approved', 'under review', 'revision requested', etc.)
 * to NotificationEvent for writer notifications.
 */
export function mapKalamStatusToEvent(status: string): NotificationEvent {
  const s = status.toLowerCase();
  if (s.includes('approv')) return 'kalam_approved';
  if (s.includes('revision')) return 'kalam_revision';
  if (s.includes('reject')) return 'rejected';
  return 'under_review';
}

/**
 * Map generic content status strings to NotificationEvent.
 */
export function mapContentStatusToEvent(status: string): NotificationEvent {
  const s = status.toLowerCase();
  if (s === 'approved' || s === 'published') return 'approved';
  if (s === 'revision_requested' || s.includes('revision')) return 'revision_requested';
  if (s === 'rejected') return 'rejected';
  if (s === 'under_review' || s.includes('review')) return 'under_review';
  if (s === 'scheduled' || s === 'session_scheduled') return 'session_scheduled';
  if (s === 'completed' || s === 'session_completed') return 'session_completed';
  if (s === 'paid') return 'royalty_paid';
  return 'under_review';
}

