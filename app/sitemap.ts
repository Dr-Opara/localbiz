import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://localbiz.lol';
  const lastModified = new Date();

  return [
    { url: base, lastModified, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/for-businesses`, lastModified, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${base}/leaderboard`, lastModified, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${base}/faq`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/terms`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/privacy`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/signup`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/login`, lastModified, changeFrequency: 'monthly', priority: 0.4 },
  ];
}
