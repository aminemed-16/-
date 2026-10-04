import 'server-only';
import { createClient } from '@/lib/supabase/server';

/** Select options for the course form. RLS lets any staff member read these lists. */
export async function getCourseFormOptions() {
  const supabase = await createClient();
  const [cats, trainers, media] = await Promise.all([
    supabase.from('course_categories').select('id, name').order('sort_order'),
    supabase.from('trainers').select('id, full_name').order('sort_order'),
    supabase.from('media').select('id, url, alt_text, mime_type').order('created_at', { ascending: false }).limit(200),
  ]);
  return {
    categories: (cats.data ?? []).map((c: any) => ({ id: c.id as string, label: c.name as string })),
    trainers: (trainers.data ?? []).map((t: any) => ({ id: t.id as string, label: t.full_name as string })),
    media: media.data ?? [],
  };
}
