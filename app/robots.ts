import { MetadataRoute } from 'next';
import { CANONICAL_ORIGIN } from '@/lib/canonical-seo';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = CANONICAL_ORIGIN;

  const privateRoutes = [
    '/admin/',
    '/user/',
    '/dashboard/',
    '/partners/',
    '/test-ocr',
    '/api/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/email-verified',
    '/adopt-song/',
    '/adoption-success',
    '/adoption-cancel',
    '/my-adoptions',
    '/unsubscribe',
  ];

  const crawlers = [
    '*',
    'Googlebot',
    'Google-Extended',
    'Bingbot',
    'GPTBot',
    'OAI-SearchBot',
    'ChatGPT-User',
    'ClaudeBot',
    'Claude-Web',
    'anthropic-ai',
    'PerplexityBot',
    'Applebot',
    'DuckDuckBot',
  ];

  return {
    rules: crawlers.map((userAgent) => ({
      userAgent,
      allow: '/',
      disallow: privateRoutes,
    })),
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
