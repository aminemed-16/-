import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const supabase = await createClient();
  const [{ data: courses }, { data: articles }] = await Promise.all([
    supabase.from('courses').select('slug, updated_at').eq('status', 'published'),
    supabase.from('articles').select('slug, updated_at').eq('status', 'published'),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = ['', '/about', '/courses', '/services', '/contact'].map((p) => ({
    url: `${base}${p}`, changeFrequency: 'weekly', priority: p === '' ? 1 : 0.7,
  }));
  const courseRoutes: MetadataRoute.Sitemap = (courses ?? []).map((c) => ({
    url: `${base}/courses/${c.slug}`, lastModified: c.updated_at, changeFrequency: 'weekly', priority: 0.8,
  }));
  const articleRoutes: MetadataRoute.Sitemap = (articles ?? []).map((a) => ({
    url: `${base}/blog/${a.slug}`, lastModified: a.updated_at, changeFrequency: 'monthly', priority: 0.5,
  }));

  return [...staticRoutes, ...courseRoutes, ...articleRoutes];
}
