'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { can, requirePermission } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';
import { parseCourseForm, randomSlug, type CourseFormState } from '@/lib/validation/course';

const NO_PUBLISH = 'لا تملك صلاحية النشر أو إلغاء النشر. احفظ التغييرات دون تغيير الحالة.';

function dbError(error: { code?: string; message: string }): CourseFormState {
  if (error.code === '23505') return { fieldErrors: { slug: 'هذا الرابط مستخدم في دورة أخرى. اختر رابطاً مختلفاً.' }, error: 'راجع الحقول المحددة.' };
  if (error.code === '42501') return { error: NO_PUBLISH };
  console.error('course write failed', error);
  return { error: 'تعذر حفظ الدورة. حاول مرة أخرى.' };
}

export async function createCourse(_prev: CourseFormState, fd: FormData): Promise<CourseFormState> {
  const ctx = await requirePermission('create_courses');
  const parsed = parseCourseForm(fd);
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors, error: 'راجع الحقول المحددة.' };

  const status = fd.get('intent') === 'publish' ? 'published' : 'draft';
  if (status === 'published' && !can(ctx, 'publish_courses')) return { error: 'لا تملك صلاحية نشر الدورات. احفظها كمسودة.' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('courses')
    .insert({
      ...parsed.data,
      slug: parsed.data.slug || randomSlug(),
      status,
      published_at: status === 'published' ? new Date().toISOString() : null,
      created_by: ctx.id,
      updated_by: ctx.id,
    })
    .select('id')
    .single();
  if (error || !data) return dbError(error ?? { message: 'no data' });

  await logAudit({
    actorId: ctx.id, actorLabel: ctx.email, action: status === 'published' ? 'publish' : 'create',
    entityType: 'course', entityId: data.id, entityLabel: String(parsed.data.title),
  });
  revalidatePath('/admin/courses');
  redirect(`/admin/courses/${data.id}?saved=1`);
}

export async function updateCourse(id: string, _prev: CourseFormState, fd: FormData): Promise<CourseFormState> {
  const ctx = await requirePermission('edit_courses');
  if (!z.string().uuid().safeParse(id).success) return { error: 'الدورة غير موجودة.' };

  const parsed = parseCourseForm(fd);
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors, error: 'راجع الحقول المحددة.' };

  const supabase = await createClient();
  const { data: current } = await supabase.from('courses').select('title, slug, status, published_at').eq('id', id).maybeSingle();
  if (!current) return { error: 'الدورة غير موجودة أو تم حذفها.' };

  const intent = String(fd.get('intent') ?? 'save');
  const nextStatus =
    intent === 'publish' ? 'published' : intent === 'unpublish' ? 'unpublished' : intent === 'draft' ? 'draft' : current.status;
  const statusChanged = nextStatus !== current.status;
  if (statusChanged && (nextStatus === 'published' || current.status === 'published') && !can(ctx, 'publish_courses')) {
    return { error: NO_PUBLISH };
  }

  const { error } = await supabase
    .from('courses')
    .update({
      ...parsed.data,
      slug: parsed.data.slug || current.slug,   // never blank out an existing URL
      status: nextStatus,
      published_at: nextStatus === 'published' ? current.published_at ?? new Date().toISOString() : current.published_at,
      updated_by: ctx.id,
    })
    .eq('id', id);
  if (error) return dbError(error);

  await logAudit({
    actorId: ctx.id, actorLabel: ctx.email,
    action: statusChanged ? (nextStatus === 'published' ? 'publish' : 'unpublish') : 'update',
    entityType: 'course', entityId: id, entityLabel: String(parsed.data.title),
    changes: statusChanged ? { status: [current.status, nextStatus] } : undefined,
  });
  revalidatePath('/admin/courses');
  redirect(`/admin/courses/${id}?saved=1`);
}

export async function deleteCourse(fd: FormData) {
  const ctx = await requirePermission('delete_courses');
  const id = String(fd.get('id') ?? '');
  if (!z.string().uuid().safeParse(id).success) redirect('/admin/courses');

  const supabase = await createClient();
  const { data: current } = await supabase.from('courses').select('title').eq('id', id).maybeSingle();
  const { error } = await supabase.from('courses').delete().eq('id', id);
  if (error) {
    console.error('course delete failed', error);
    redirect('/admin/courses?error=delete');
  }

  await logAudit({
    actorId: ctx.id, actorLabel: ctx.email, action: 'delete',
    entityType: 'course', entityId: id, entityLabel: current?.title,
  });
  revalidatePath('/admin/courses');
  redirect('/admin/courses?deleted=1');
}
