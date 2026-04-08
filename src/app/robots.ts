import { env } from '@/lib/env';
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = env.NEXT_PUBLIC_APP_URL.endsWith('/')
    ? env.NEXT_PUBLIC_APP_URL.slice(0, -1)
    : env.NEXT_PUBLIC_APP_URL;

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/api/', '/_next/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
