import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sufipulse.com';

  const privateRoutes = ['/admin/', '/user/', '/api/', '/login', '/register'];

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: privateRoutes,
      },
      {
        userAgent: 'Googlebot',
        allow: ['/', '/releases', '/literary-journal', '/knowledge', '/about/', '/writers', '/vocalists', '/producers', '/studio', '/contact'],
        disallow: privateRoutes,
      },
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: privateRoutes,
      },
      {
        userAgent: 'anthropic-ai',
        allow: '/',
        disallow: privateRoutes,
      },
      {
        userAgent: 'Claude-Web',
        allow: '/',
        disallow: privateRoutes,
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: privateRoutes,
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: privateRoutes,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
