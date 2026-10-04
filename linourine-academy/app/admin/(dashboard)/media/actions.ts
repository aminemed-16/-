'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAudit } from '@/lib/audit';

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'media';
const uuid = z.string().uuid();

export async function updateAlt(id: string, altText: string) {
  const ctx = await requirePermission('manage_media');
  if (!uuid.safeParse(id).success) return;
  const supabase = await createClient();
  await supabase.from('media').update({ alt_text: altText.trim().slice(0, 200) || null }).eq('id', id);
  void ctx;
  revalidatePath('/admin/media');
}

export async function deleteMedia(fd: FormData) {
  const ctx = await requirePermission('manage_media');
  const id = String(fd.get('id') ?? '');
  if (!uuid.safeParse(id).success) return;

  const supabase = await createClient();
  const { data: row } = await supabase.from('media').select('storage_path').eq('id', id).maybeSingle();
  if (!row) return;

  // Refuse to delete media that is still referenced, so a course never ends up with a broken image.
  const [courses, course_media, services] = await Promise.all([
    supabase.from('courses').select('id', { count: 'exact', head: true }).or(`cover_media_id.eq.${id},og_media_id.eq.${id}`),
    supabase.from('course_media').select('course_id', { count: 'exact', head: true }).eq('media_id', id),
    supabase.from('services').select('id', { count: 'exact', head: true }).eq('image_id', id),
  ]);
  const inUse = (courses.count ?? 0) + (course_media.count ?? 0) + (services.count ?? 0) > 0;
  if (inUse) return; // UI disables the button in this case; this is the server-side backstop

  await createAdminClient().storage.from(BUCKET).remove([row.storage_path]);
  await supabase.from('media').delete().eq('id', id);
  await logAudit({ actorId: ctx.id, actorLabel: ctx.email, action: 'delete', entityType: 'media', entityId: id });
  revalidatePath('/admin/media');
}
