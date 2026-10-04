import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Mail, MessageCircle, Phone } from 'lucide-react';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/admin/page-header';
import { ConfirmDeleteButton } from '@/components/admin/confirm-delete';
import { RegistrationManageForm } from '@/components/admin/registration-manage-form';
import { can, requirePermission } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { requestStatusLabels, requestStatusTones } from '@/lib/labels';
import { whatsappLink } from '@/lib/validation/registration';
import { deleteRegistration, updateRegistration } from '../actions';

export const metadata: Metadata = { title: 'تفاصيل الطلب' };

type Req = {
  id: string; course_id: string | null; course_title_snapshot: string | null; full_name: string; phone: string;
  email: string | null; wilaya: string; commune: string | null; notes: string | null;
  status: keyof typeof requestStatusLabels; internal_notes: string | null; created_at: string; updated_at: string;
};

const action = 'inline-flex h-10 items-center gap-2 rounded-control border border-line px-4 text-sm text-navy hover:bg-mist';

export default async function RegistrationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requirePermission('view_orders');
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();

  const supabase = await createClient();
  const { data } = await supabase.from('registration_requests').select('*').eq('id', id).maybeSingle();
  if (!data) notFound();
  const r = data as unknown as Req;

  // Opening the request clears its dashboard notification (RLS: only for people allowed to see it).
  await supabase.from('notifications').update({ is_read: true }).eq('entity_id', id).eq('is_read', false);

  const date = new Intl.DateTimeFormat('ar-DZ', { dateStyle: 'long', timeStyle: 'short' });
  const wa = whatsappLink(r.phone);
  const rows: Array<[string, React.ReactNode]> = [
    ['الدورة', r.course_id
      ? <Link key="c" href={`/admin/courses/${r.course_id}`} className="text-royal hover:underline">{r.course_title_snapshot}</Link>
      : (r.course_title_snapshot ?? 'تسجيل عام (غير مرتبط بدورة)')],
    ['الولاية', r.wilaya],
    ['البلدية', r.commune || '—'],
    ['تاريخ الإرسال', date.format(new Date(r.created_at))],
    ['آخر تحديث', date.format(new Date(r.updated_at))],
  ];

  return (
    <>
      <PageHeader
        title={r.full_name}
        actions={<Link href="/admin/registrations" className="text-sm text-navy hover:underline">العودة إلى الطلبات</Link>}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <section className="space-y-6 rounded-card border border-line bg-white p-5 shadow-card sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone={requestStatusTones[r.status]}>{requestStatusLabels[r.status]}</Badge>
            <span dir="ltr" className="text-lg font-semibold tabular-nums text-navy">{r.phone}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <a href={`tel:${r.phone}`} className={action}><Phone size={16} aria-hidden /> اتصال</a>
            {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className={action}><MessageCircle size={16} aria-hidden /> واتساب</a>}
            {r.email && <a href={`mailto:${r.email}`} className={action}><Mail size={16} aria-hidden /> {r.email}</a>}
          </div>

          <dl className="divide-y divide-line text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-3">
                <dt className="text-ink/55">{k}</dt>
                <dd className="text-end font-medium text-ink">{v}</dd>
              </div>
            ))}
          </dl>

          <div>
            <h2 className="mb-2 text-sm font-semibold text-navy">ملاحظات المتقدم</h2>
            <p className="whitespace-pre-line rounded-control bg-mist p-4 text-sm leading-7 text-ink/80">{r.notes || 'لا توجد ملاحظات.'}</p>
          </div>
        </section>

        <aside className="space-y-4">
          {can(ctx, 'edit_orders') ? (
            <section className="rounded-card border border-line bg-white p-5 shadow-card">
              <h2 className="mb-4 font-bold text-navy">متابعة الطلب</h2>
              <RegistrationManageForm status={r.status} notes={r.internal_notes ?? ''} action={updateRegistration.bind(null, id)} />
            </section>
          ) : (
            <section className="rounded-card border border-line bg-white p-5 text-sm shadow-card">
              <h2 className="mb-2 font-bold text-navy">ملاحظات داخلية</h2>
              <p className="whitespace-pre-line text-ink/75">{r.internal_notes || 'لا توجد ملاحظات.'}</p>
            </section>
          )}
          {can(ctx, 'delete_orders') && (
            <div className="flex justify-end">
              <ConfirmDeleteButton action={deleteRegistration} id={r.id} ariaLabel={`حذف طلب ${r.full_name}`}
                heading="حذف الطلب؟" confirmLabel="نعم، احذف الطلب"
                body={`سيتم حذف طلب «${r.full_name}» نهائياً ولا يمكن التراجع عن ذلك.`} />
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
