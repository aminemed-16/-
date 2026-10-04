'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getStaffContext } from '@/lib/auth/session';
import { logAudit } from '@/lib/audit';

export async function signOut() {
  const ctx = await getStaffContext();
  const supabase = await createClient();
  await supabase.auth.signOut();
  if (ctx) await logAudit({ actorId: ctx.id, actorLabel: ctx.email, action: 'logout', entityType: 'session' });
  redirect('/admin/login');
}
