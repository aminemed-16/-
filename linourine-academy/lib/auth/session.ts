import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type StaffContext = {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
};

/** The signed-in user IF they are active staff (have at least one role); otherwise null. */
export const getStaffContext = cache(async (): Promise<StaffContext | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profile, roles, perms] = await Promise.all([
    supabase.from('profiles').select('full_name, is_active').eq('id', user.id).maybeSingle(),
    supabase.from('user_roles').select('roles(key)').eq('user_id', user.id),
    supabase.rpc('my_permissions'),
  ]);

  const roleKeys = (roles.data ?? []).flatMap((r: any) => (r.roles?.key ? [r.roles.key as string] : []));
  if (!profile.data?.is_active || roleKeys.length === 0) return null;

  return {
    id: user.id,
    email: user.email ?? '',
    fullName: profile.data.full_name || user.email || '',
    roles: roleKeys,
    permissions: (perms.data as string[] | null) ?? [],
  };
});

export async function requireStaff(): Promise<StaffContext> {
  const ctx = await getStaffContext();
  if (!ctx) redirect('/admin/login?error=no-access');
  return ctx;
}

/** Use at the top of every admin page and server action. */
export async function requirePermission(permission: string): Promise<StaffContext> {
  const ctx = await requireStaff();
  if (!ctx.roles.includes('super_admin') && !ctx.permissions.includes(permission)) {
    redirect('/admin/forbidden');
  }
  return ctx;
}

export function can(ctx: StaffContext, permission: string) {
  return ctx.roles.includes('super_admin') || ctx.permissions.includes(permission);
}
