import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: 'OAI-SearchBot',
        allow: '/',
      },
      {
        userAgent: 'OAI-AdsBot',
        allow: '/',
      },
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/api/'],
      },
    ],
    sitemap: 'https://localbiz.lol/sitemap.xml',
    host: 'https://localbiz.lol',
  };
}
