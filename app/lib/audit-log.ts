import fs from 'node:fs';
import path from 'node:path';

export type AuditAction =
  | 'release_created'
  | 'release_updated'
  | 'release_deleted'
  | 'release_published'
  | 'release_unpublished'
  | 'subtitle_updated'
  | 'lyrics_updated'
  | 'credits_updated'
  | 'commentary_updated'
  | 'sponsors_updated'
  | 'user_login'
  | 'user_logout'
  | 'user_created'
  | 'settings_updated';

export type AuditEntry = {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
};

const AUDIT_DIR = path.join(process.cwd(), '.data', 'audit');
const AUDIT_FILE = path.join(AUDIT_DIR, 'audit-log.json');

// Ensure audit log directory exists
const ensureAuditDir = () => {
  if (!fs.existsSync(AUDIT_DIR)) {
    fs.mkdirSync(AUDIT_DIR, { recursive: true });
  }
};

// Read audit log entries
const readAuditLog = (): AuditEntry[] => {
  ensureAuditDir();
  if (!fs.existsSync(AUDIT_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(AUDIT_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

// Write audit log entry
const writeAuditLog = (entries: AuditEntry[]) => {
  ensureAuditDir();
  // Keep only last 10000 entries to prevent file growth
  const trimmed = entries.slice(-10000);
  fs.writeFileSync(AUDIT_FILE, JSON.stringify(trimmed, null, 2), 'utf8');
};

// Log an audit entry
export const auditLog = (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => {
  const entries = readAuditLog();
  entries.push({
    ...entry,
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    timestamp: new Date().toISOString(),
  });
  writeAuditLog(entries);
};

// Get recent audit entries
export const getAuditLog = (options?: {
  limit?: number;
  action?: AuditAction;
  userId?: string;
  resourceId?: string;
}): AuditEntry[] => {
  let entries = readAuditLog();

  if (options?.action) {
    entries = entries.filter((e) => e.action === options.action);
  }
  if (options?.userId) {
    entries = entries.filter((e) => e.userId === options.userId);
  }
  if (options?.resourceId) {
    entries = entries.filter((e) => e.resourceId === options.resourceId);
  }

  // Return most recent first, limited
  const limit = options?.limit || 100;
  return entries.slice(-limit).reverse();
};
