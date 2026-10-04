'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requirePermission } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';

const uuid = z.string().uuid();

export async function markMessageRead(id: string, read: boolean) {
  const ctx = await requirePermission('manage_messages');
  if (!uuid.safeParse(id).success) return;
  const supabase = await createClient();
  await supabase.from('contact_messages').update({ is_read: read }).eq('id', id);
  await supabase.from('notifications').update({ is_read: true }).eq('entity_id', id);
  void ctx;
  revalidatePath('/admin/messages');
}

export async function deleteMessage(fd: FormData) {
  const ctx = await requirePermission('manage_messages');
  const id = String(fd.get('id') ?? '');
  if (!uuid.safeParse(id).success) redirect('/admin/messages');

  const supabase = await createClient();
  const { data: current } = await supabase.from('contact_messages').select('name').eq('id', id).maybeSingle();
  const { error } = await supabase.from('contact_messages').delete().eq('id', id);
  if (error) { console.error('message delete failed', error); redirect('/admin/messages?error=delete'); }

  await logAudit({ actorId: ctx.id, actorLabel: ctx.email, action: 'delete', entityType: 'contact_message', entityId: id, entityLabel: current?.name });
  revalidatePath('/admin/messages');
  redirect('/admin/messages?deleted=1');
}
