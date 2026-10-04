import type { Metadata } from 'next';
import { Notice, PageHeader } from '@/components/admin/page-header';
import { MessageRow } from '@/components/admin/message-row';
import { can, requirePermission } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'رسائل التواصل' };

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ deleted?: string; error?: string }> }) {
  const ctx = await requirePermission('view_messages');
  const canManage = can(ctx, 'manage_messages');
  const sp = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(100);
  const date = new Intl.DateTimeFormat('ar-DZ', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <>
      <PageHeader title="رسائل التواصل" description={`${(data?.length ?? 0).toLocaleString('ar-DZ')} رسالة`} />
      {sp.deleted && <Notice>تم حذف الرسالة.</Notice>}
      {sp.error === 'delete' && <Notice tone="error">تعذر حذف الرسالة.</Notice>}
      {(data?.length ?? 0) === 0 ? (
        <div className="rounded-card border border-dashed border-line bg-white p-10 text-center text-ink/60">لا توجد رسائل بعد.</div>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-white shadow-card">
          {data!.map((m) => <MessageRow key={m.id} msg={m} dateLabel={date.format(new Date(m.created_at))} canManage={canManage} />)}
        </ul>
      )}
    </>
  );
}
