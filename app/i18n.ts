/**
 * Internationalization (i18n) Configuration
 * 
 * Supports English and Urdu with RTL layout for Urdu
 */

export const locales = ['en', 'ur'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ur: 'اردو',
};

export const isRTL = (locale: Locale): boolean => {
  return locale === 'ur';
};

export const getTextDirection = (locale: Locale): 'ltr' | 'rtl' => {
  return isRTL(locale) ? 'rtl' : 'ltr';
};

/**
 * Get locale from URL or cookie
 */
export function getLocaleFromRequest(request?: Request): Locale {
  if (!request) return defaultLocale;

  const url = new URL(request.url);
  const localeParam = url.searchParams.get('locale');
  
  if (localeParam && locales.includes(localeParam as Locale)) {
    return localeParam as Locale;
  }

  // Check cookie
  const cookie = request.headers.get('cookie');
  if (cookie) {
    const match = cookie.match(/locale=([a-z]+)/);
    if (match && locales.includes(match[1] as Locale)) {
      return match[1] as Locale;
    }
  }

  return defaultLocale;
}

/**
 * Format date based on locale
 */
export function formatDate(date: Date | string, locale: Locale = defaultLocale): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (locale === 'ur') {
    return d.toLocaleDateString('ur-PK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format number based on locale
 */
export function formatNumber(number: number, locale: Locale = defaultLocale): string {
  if (locale === 'ur') {
    return number.toLocaleString('ur-PK');
  }

  return number.toLocaleString('en-US');
}

/**
 * Translate a key path to actual text
 * Simple implementation - for production use next-intl package
 */
export function t(key: string, locale: Locale = defaultLocale): string {
  // This is a placeholder - in production, load from message files
  const keys = key.split('.');
  let value: any = keys[0];
  
  // TODO: Implement actual message loading from en.json / ur.json
  return value;
}

export default {
  locales,
  defaultLocale,
  localeNames,
  isRTL,
  getTextDirection,
  getLocaleFromRequest,
  formatDate,
  formatNumber,
  t,
};
