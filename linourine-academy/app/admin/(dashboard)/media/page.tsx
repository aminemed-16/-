import type { Metadata } from 'next';
import { PageHeader } from '@/components/admin/page-header';
import { MediaUploader } from '@/components/admin/media-uploader';
import { MediaGrid } from '@/components/admin/media-grid';
import { requirePermission } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'الصور والملفات' };

export default async function MediaPage() {
  await requirePermission('manage_media');
  const supabase = await createClient();

  const [{ data: media }, courseRefs, courseMediaRefs, serviceRefs] = await Promise.all([
    supabase.from('media').select('id, url, alt_text, mime_type').order('created_at', { ascending: false }).limit(200),
    supabase.from('courses').select('cover_media_id, og_media_id'),
    supabase.from('course_media').select('media_id'),
    supabase.from('services').select('image_id'),
  ]);

  const used = new Set<string>();
  for (const c of courseRefs.data ?? []) { if (c.cover_media_id) used.add(c.cover_media_id); if (c.og_media_id) used.add(c.og_media_id); }
  for (const c of courseMediaRefs.data ?? []) used.add(c.media_id);
  for (const s of serviceRefs.data ?? []) { if (s.image_id) used.add(s.image_id); }

  const items = (media ?? []).map((m) => ({ ...m, in_use: used.has(m.id) }));

  return (
    <>
      <PageHeader title="الصور والملفات" description={`${items.length.toLocaleString('ar-DZ')} ملف`} />
      <div className="mb-6"><MediaUploader /></div>
      <MediaGrid items={items} />
    </>
  );
}
