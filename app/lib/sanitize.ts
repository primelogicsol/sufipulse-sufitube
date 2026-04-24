/**
 * Input sanitization utilities for preventing XSS and injection attacks.
 */

// Remove HTML tags but preserve basic text
export const sanitizeText = (input: string): string => {
  if (typeof input !== 'string') return String(input);
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Sanitize rich text content (allows basic formatting)
export const sanitizeRichText = (input: string): string => {
  if (typeof input !== 'string') return String(input);
  return input
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '');
};

// Sanitize URL
export const sanitizeUrl = (input: string): string => {
  if (typeof input !== 'string') return '';
  // Only allow http/https URLs
  const url = input.trim();
  if (!url) return '';
  if (!url.match(/^https?:\/\//i)) {
    return 'https://' + url;
  }
  return url;
};

// Sanitize email
export const sanitizeEmail = (input: string): string => {
  if (typeof input !== 'string') return '';
  return input.trim().toLowerCase().replace(/[^a-z0-9@._+-]/g, '');
};

// Sanitize slug
export const sanitizeSlug = (input: string): string => {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

// Sanitize object recursively
export const sanitizeObject = <T extends Record<string, any>>(
  obj: T,
  rules: Partial<Record<keyof T, 'text' | 'rich_text' | 'url' | 'email' | 'slug'>>
): T => {
  const sanitized = { ...obj };

  for (const [key, rule] of Object.entries(rules) as [keyof T, string][]) {
    const value = sanitized[key];
    if (typeof value !== 'string') continue;

    switch (rule) {
      case 'text':
        sanitized[key] = sanitizeText(value) as any;
        break;
      case 'rich_text':
        sanitized[key] = sanitizeRichText(value) as any;
        break;
      case 'url':
        sanitized[key] = sanitizeUrl(value) as any;
        break;
      case 'email':
        sanitized[key] = sanitizeEmail(value) as any;
        break;
      case 'slug':
        sanitized[key] = sanitizeSlug(value) as any;
        break;
    }
  }

  return sanitized;
};
