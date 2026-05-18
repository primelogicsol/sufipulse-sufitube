/**
 * Input sanitization utilities for preventing XSS and injection attacks.
 */

// Neutralize HTML tags and block dangerous patterns in plain text
export const sanitizeText = (input: string): string => {
  if (typeof input !== 'string') return String(input);
  
  // 1. Basic HTML escaping
  let sanitized = input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
    
  // 2. Block dangerous keywords that could be used in various contexts
  sanitized = sanitized
    .replace(/javascript:/gi, '[removed]')
    .replace(/data:/gi, '[removed]')
    .replace(/vbscript:/gi, '[removed]')
    .replace(/\son\w+\s*=/gi, ' [removed]='); // blocks onclick, onerror, etc.
    
  // 3. Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  return sanitized;
};

// Sanitize rich text content (allows basic formatting but removes scripts/events)
export const sanitizeRichText = (input: string): string => {
  if (typeof input !== 'string') return String(input);
  return input
    // Remove script tags and their content
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    // Remove iframe tags
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
    // Remove all event handlers (onmouseover, onclick, etc.)
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
    // Remove javascript: URLs
    .replace(/javascript:/gi, '[removed]')
    // Remove data: URLs
    .replace(/data:/gi, '[removed]')
    // Normalize whitespace
    .trim();
};

// Sanitize URL
export const sanitizeUrl = (input: string): string => {
  if (typeof input !== 'string') return '';
  const url = input.trim();
  if (!url) return '';
  
  // Block dangerous protocols
  if (url.match(/^(javascript|data|file|vbscript):/i)) {
    return '';
  }
  
  // Ensure protocol if missing, but only allow http/https
  if (!url.match(/^https?:\/\//i)) {
    // If it looks like a relative path or local file, reject
    if (url.startsWith('/') || url.startsWith('file:')) return '';
    // Basic format check: needs at least one dot
    if (!url.includes('.')) return '';
    return 'https://' + url;
  }
  
  return url;
};

// Sanitize email
export const sanitizeEmail = (input: string): string => {
  if (typeof input !== 'string') return '';
  // Basic normalization: trim, lowercase, remove non-email chars
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

/**
 * Universal object-based sanitization
 */
export const sanitizeObject = <T extends Record<string, any>>(
  obj: T,
  rules: Partial<Record<keyof T, 'text' | 'rich_text' | 'url' | 'email' | 'slug'>>
): T => {
  const sanitized = { ...obj };

  for (const [key, rule] of Object.entries(rules) as [keyof T, string][]) {
    const value = sanitized[key];
    if (value === undefined || value === null) continue;
    
    // Handle arrays if necessary
    if (Array.isArray(value)) {
      sanitized[key] = value.map((v: any) => {
        if (typeof v !== 'string') return v;
        return applyRule(v, rule);
      }) as any;
      continue;
    }

    if (typeof value !== 'string') continue;
    sanitized[key] = applyRule(value, rule) as any;
  }

  return sanitized;
};

function applyRule(value: string, rule: string): string {
  switch (rule) {
    case 'text': return sanitizeText(value);
    case 'rich_text': return sanitizeRichText(value);
    case 'url': return sanitizeUrl(value);
    case 'email': return sanitizeEmail(value);
    case 'slug': return sanitizeSlug(value);
    default: return value;
  }
}
