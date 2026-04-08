import { env } from '@/lib/env';
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = env.NEXT_PUBLIC_APP_URL.endsWith('/')
    ? env.NEXT_PUBLIC_APP_URL.slice(0, -1)
    : env.NEXT_PUBLIC_APP_URL;

  const routes = ['', '/about', '/faq', '/waitlist', '/risk-assessment'];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: route === '' ? 1 : 0.8,
  }));
}
