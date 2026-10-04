import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/admin-shell';
import { requireStaff } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '../actions';

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

const roleLabels: Record<string, string> = {
  super_admin: 'مدير عام',
  admin: 'مسؤول',
  manager: 'مدير',
  editor: 'محرر',
  moderator: 'مشرف',
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireStaff();

  // RLS limits notifications to the ones this user has permission to see.
  const supabase = await createClient();
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('is_read', false);

  return (
    <AdminShell
      user={{
        fullName: ctx.fullName,
        email: ctx.email,
        roleLabel: ctx.roles.map((r) => roleLabels[r] ?? r).join('، '),
      }}
      permissions={ctx.permissions}
      isSuperAdmin={ctx.roles.includes('super_admin')}
      unreadCount={count ?? 0}
      signOutAction={signOut}
    >
      {children}
    </AdminShell>
  );
}
