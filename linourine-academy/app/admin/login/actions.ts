'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getClientIp, hashValue } from '@/lib/hash';
import { rateLimit } from '@/lib/rate-limit';
import { logAudit } from '@/lib/audit';
import { loginSchema, safeAdminPath } from '@/lib/validation/auth';

export type LoginState = { error?: string };

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) return { error: 'تحقق من البريد الإلكتروني وكلمة السر (8 أحرف على الأقل).' };

  const { email, password } = parsed.data;
  const ipKey = hashValue(await getClientIp());

  // 8 attempts per IP and 5 per account, every 10 minutes
  const [byIp, byEmail] = await Promise.all([
    rateLimit(`login:ip:${ipKey}`, 8, 600),
    rateLimit(`login:email:${hashValue(email)}`, 5, 600),
  ]);
  if (!byIp.ok || !byEmail.ok) return { error: 'محاولات كثيرة. انتظر بضع دقائق ثم أعد المحاولة.' };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  // Same message for unknown email and wrong password: no account enumeration.
  if (error || !data.user) return { error: 'البريد الإلكتروني أو كلمة السر غير صحيحة.' };

  const { data: roles } = await supabase.from('user_roles').select('role_id').eq('user_id', data.user.id);
  const { data: profile } = await supabase.from('profiles').select('is_active').eq('id', data.user.id).maybeSingle();
  if (!roles?.length || !profile?.is_active) {
    await supabase.auth.signOut();
    return { error: 'هذا الحساب لا يملك صلاحية الدخول إلى لوحة الإدارة.' };
  }

  await logAudit({ actorId: data.user.id, actorLabel: email, action: 'login', entityType: 'session' });
  redirect(safeAdminPath(formData.get('next')));
}
