'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requirePermission } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';
import { adminRegistrationSchema, type RegistrationFormState } from '@/lib/validation/registration';

const uuid = z.string().uuid();

export async function updateRegistration(id: string, _prev: RegistrationFormState, fd: FormData): Promise<RegistrationFormState> {
  const ctx = await requirePermission('edit_orders');
  if (!uuid.safeParse(id).success) return { error: 'الطلب غير موجود.' };

  const parsed = adminRegistrationSchema.safeParse({ status: fd.get('status'), internal_notes: fd.get('internal_notes') ?? '' });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { error: 'راجع الحقول المحددة.', fieldErrors };
  }

  const supabase = await createClient();
  const { data: current } = await supabase
    .from('registration_requests').select('status, internal_notes, full_name').eq('id', id).maybeSingle();
  if (!current) return { error: 'الطلب غير موجود أو تم حذفه.' };

  const notes = parsed.data.internal_notes || null;
  const statusChanged = current.status !== parsed.data.status;
  if (!statusChanged && (current.internal_notes ?? null) === notes) return { ok: true };

  const { error } = await supabase
    .from('registration_requests')
    .update({ status: parsed.data.status, internal_notes: notes })
    .eq('id', id);
  if (error) {
    console.error('registration update failed', error);
    return { error: 'تعذر حفظ التغييرات. حاول مرة أخرى.' };
  }

  await logAudit({
    actorId: ctx.id, actorLabel: ctx.email,
    action: statusChanged ? 'status_change' : 'update',
    entityType: 'registration_request', entityId: id, entityLabel: current.full_name,
    changes: statusChanged ? { status: [current.status, parsed.data.status] } : { internal_notes: 'updated' },
  });
  revalidatePath('/admin/registrations');
  revalidatePath(`/admin/registrations/${id}`);
  return { ok: true };
}

export async function deleteRegistration(fd: FormData) {
  const ctx = await requirePermission('delete_orders');
  const id = String(fd.get('id') ?? '');
  if (!uuid.safeParse(id).success) redirect('/admin/registrations');

  const supabase = await createClient();
  const { data: current } = await supabase.from('registration_requests').select('full_name').eq('id', id).maybeSingle();
  const { error } = await supabase.from('registration_requests').delete().eq('id', id);
  if (error) {
    console.error('registration delete failed', error);
    redirect('/admin/registrations?error=delete');
  }

  await logAudit({
    actorId: ctx.id, actorLabel: ctx.email, action: 'delete',
    entityType: 'registration_request', entityId: id, entityLabel: current?.full_name,
  });
  revalidatePath('/admin/registrations');
  redirect('/admin/registrations?deleted=1');
}
