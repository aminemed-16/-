import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { can, requireStaff } from '@/lib/auth/session';
import { requestStatusLabels, requestStatusTones } from '@/lib/labels';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'لوحة التحكم' };

type Stat = { label: string; value: number; tone?: 'accent' };

export default async function DashboardPage() {
  const ctx = await requireStaff();
  const supabase = await createClient();
  const count = async (table: string, status?: string) => {
    let q = supabase.from(table).select('id', { count: 'exact', head: true });
    if (status) q = q.eq('status', status);
    return (await q).count ?? 0;
  };

  const stats: Stat[] = [];
  const canOrders = can(ctx, 'view_orders');
  const [courses, fresh, review, accepted, latest] = await Promise.all([
    can(ctx, 'view_courses') ? count('courses') : null,
    can(ctx, 'view_orders') ? count('registration_requests', 'new') : null,
    can(ctx, 'view_orders') ? count('registration_requests', 'in_review') : null,
    can(ctx, 'view_orders') ? count('registration_requests', 'accepted') : null,
    canOrders
      ? supabase.from('registration_requests').select('id, full_name, course_title_snapshot, created_at, status')
          .order('created_at', { ascending: false }).limit(5).then((r) => r.data ?? [])
      : [],
  ]);
  if (courses !== null) stats.push({ label: 'إجمالي الدورات', value: courses });
  if (fresh !== null) stats.push({ label: 'طلبات جديدة', value: fresh, tone: 'accent' });
  if (review !== null) stats.push({ label: 'طلبات قيد المراجعة', value: review });
  if (accepted !== null) stats.push({ label: 'طلبات مقبولة', value: accepted });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy">مرحباً {ctx.fullName}</h1>
        <p className="mt-1 text-sm text-ink/60">ملخص سريع لما يحدث في الأكاديمية.</p>
      </div>

      {stats.length > 0 ? (
        <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-card border border-line bg-white p-5 shadow-card">
              <dt className="text-sm text-ink/60">{s.label}</dt>
              <dd className={`mt-2 text-3xl font-bold tabular-nums ${s.tone === 'accent' ? 'text-magenta' : 'text-navy'}`}>
                {s.value.toLocaleString('ar-DZ')}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <div className="rounded-card border border-dashed border-line bg-white p-8 text-center text-sm text-ink/60">
          لا توجد إحصائيات متاحة لدورك حالياً.
        </div>
      )}

      {latest.length > 0 ? (
        <section className="overflow-hidden rounded-card border border-line bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-bold text-navy">أحدث الطلبات</h2>
            <Link href="/admin/registrations" className="text-sm text-royal hover:underline">عرض الكل</Link>
          </div>
          <ul className="divide-y divide-line">
            {latest.map((r: any) => (
              <li key={r.id}>
                <Link href={`/admin/registrations/${r.id}`} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-mist">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-navy">{r.full_name}</span>
                    <span className="block truncate text-xs text-ink/55">{r.course_title_snapshot ?? 'تسجيل عام'}</span>
                  </span>
                  <Badge tone={requestStatusTones[r.status as keyof typeof requestStatusTones]}>
                    {requestStatusLabels[r.status as keyof typeof requestStatusLabels]}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <div className="rounded-card border border-dashed border-line bg-white p-8 text-center">
          <p className="font-semibold text-navy">ابدأ بإضافة أول دورة</p>
          <p className="mt-1 text-sm text-ink/60">ستظهر هنا أحدث الطلبات بعد أن يبدأ الزوار بالتسجيل.</p>
        </div>
      )}
    </div>
  );
}
