import type { Metadata } from 'next';
import Link from 'next/link';
import { Phone, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Notice, PageHeader } from '@/components/admin/page-header';
import { requirePermission } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { requestStatusLabels, requestStatusTones } from '@/lib/labels';
import { cn } from '@/lib/cn';

export const metadata: Metadata = { title: 'طلبات التسجيل' };

const PAGE_SIZE = 15;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
type Status = keyof typeof requestStatusLabels;
type Row = {
  id: string; full_name: string; phone: string; wilaya: string; status: Status;
  created_at: string; course_title_snapshot: string | null;
};

const field = 'h-10 rounded-control border border-line bg-white px-3 text-sm focus:border-royal focus:outline-none focus:ring-2 focus:ring-royal/20';

export default async function RegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; course?: string; from?: string; to?: string; page?: string; deleted?: string; error?: string }>;
}) {
  await requirePermission('view_orders');
  const sp = await searchParams;

  const q = (sp.q ?? '').replace(/[%_\\,()]/g, ' ').trim().slice(0, 80);
  const status = sp.status && sp.status in requestStatusLabels ? sp.status : '';
  const course = /^[0-9a-f-]{36}$/i.test(sp.course ?? '') ? sp.course! : '';
  const from = DATE.test(sp.from ?? '') ? sp.from! : '';
  const to = DATE.test(sp.to ?? '') ? sp.to! : '';
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1);

  const supabase = await createClient();
  let query = supabase
    .from('registration_requests')
    .select('id, full_name, phone, wilaya, status, created_at, course_title_snapshot', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (status) query = query.eq('status', status);
  if (course) query = query.eq('course_id', course);
  if (from) query = query.gte('created_at', `${from}T00:00:00`);
  if (to) query = query.lt('created_at', new Date(new Date(`${to}T00:00:00`).getTime() + 86400_000).toISOString());
  if (q) query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`);

  const [{ data, count, error }, courses, newCount] = await Promise.all([
    query,
    supabase.from('courses').select('id, title').order('title'),
    supabase.from('registration_requests').select('id', { count: 'exact', head: true }).eq('status', 'new'),
  ]);
  const rows = (data ?? []) as unknown as Row[];
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filtered = Boolean(q || status || course || from || to);

  const href = (p: Record<string, string | number>) => {
    const params = new URLSearchParams();
    const merged = { q, status, course, from, to, page: 1, ...p };
    Object.entries(merged).forEach(([k, v]) => { if (v && !(k === 'page' && v === 1)) params.set(k, String(v)); });
    const s = params.toString();
    return `/admin/registrations${s ? `?${s}` : ''}`;
  };
  const date = new Intl.DateTimeFormat('ar-DZ', { dateStyle: 'medium', timeStyle: 'short' });
  const keep = { q, course, from, to };

  return (
    <>
      <PageHeader title="طلبات التسجيل" description={`${total.toLocaleString('ar-DZ')} طلب`} />

      {sp.deleted && <Notice>تم حذف الطلب.</Notice>}
      {sp.error === 'delete' && <Notice tone="error">تعذر حذف الطلب. حاول مرة أخرى.</Notice>}
      {error && <Notice tone="error">تعذر تحميل الطلبات. حدّث الصفحة وحاول مجدداً.</Notice>}

      <nav aria-label="تصفية حسب الحالة" className="mb-4 flex flex-wrap gap-1.5">
        <Link href={href({ status: '', page: 1 })} aria-current={!status ? 'page' : undefined}
          className={cn('rounded-full px-3.5 py-1.5 text-sm', !status ? 'bg-navy text-white' : 'bg-white text-ink/70 hover:bg-navy/5')}>الكل</Link>
        {Object.entries(requestStatusLabels).map(([k, l]) => (
          <Link key={k} href={href({ status: k, page: 1 })} aria-current={status === k ? 'page' : undefined}
            className={cn('rounded-full px-3.5 py-1.5 text-sm', status === k ? 'bg-navy text-white' : 'bg-white text-ink/70 hover:bg-navy/5')}>
            {l}{k === 'new' && (newCount.count ?? 0) > 0 && (
              <span className="ms-1.5 rounded-full bg-magenta px-1.5 py-0.5 text-[10px] font-bold text-white">{newCount.count}</span>
            )}
          </Link>
        ))}
      </nav>

      <form action="/admin/registrations" className="mb-5 grid gap-3 rounded-card border border-line bg-white p-4 shadow-card sm:grid-cols-2 lg:grid-cols-[1.4fr_1.2fr_1fr_1fr_auto]">
        {status && <input type="hidden" name="status" value={status} />}
        <div className="relative">
          <Search size={16} aria-hidden className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input name="q" defaultValue={q} placeholder="الاسم أو رقم الهاتف" aria-label="بحث" className={cn(field, 'w-full ps-9')} />
        </div>
        <select name="course" defaultValue={course} aria-label="الدورة" className={field}>
          <option value="">كل الدورات</option>
          {(courses.data ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <input type="date" name="from" defaultValue={from} aria-label="من تاريخ" className={field} />
        <input type="date" name="to" defaultValue={to} aria-label="إلى تاريخ" className={field} />
        <div className="flex gap-2">
          <Button type="submit" variant="outline" size="sm" className="h-10">تطبيق</Button>
          {filtered && <Link href={href({ q: '', course: '', from: '', to: '', status: '' })} className="inline-flex h-10 items-center px-2 text-sm text-navy hover:underline">مسح</Link>}
        </div>
      </form>

      {rows.length === 0 ? (
        <div className="rounded-card border border-dashed border-line bg-white p-10 text-center">
          <p className="font-semibold text-navy">{filtered ? 'لا توجد طلبات مطابقة' : 'لا توجد طلبات تسجيل بعد'}</p>
          <p className="mt-1 text-sm text-ink/60">{filtered ? 'جرّب تغيير التصفية.' : 'ستظهر هنا الطلبات التي يرسلها الزوار من صفحات الدورات.'}</p>
        </div>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-white shadow-card">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-3 p-4 sm:p-5">
              <Link href={`/admin/registrations/${r.id}`} className="min-w-0 flex-1 space-y-1.5 hover:opacity-80">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn('truncate text-navy', r.status === 'new' ? 'font-bold' : 'font-semibold')}>{r.full_name}</span>
                  <Badge tone={requestStatusTones[r.status]}>{requestStatusLabels[r.status]}</Badge>
                </div>
                <p className="text-xs text-ink/55">
                  {[r.course_title_snapshot ?? 'تسجيل عام', r.wilaya, date.format(new Date(r.created_at))].join(' • ')}
                </p>
              </Link>
              <a href={`tel:${r.phone}`} dir="ltr" aria-label={`اتصال بـ ${r.full_name}`}
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-control border border-line px-3 text-sm text-navy hover:bg-mist">
                <Phone size={15} aria-hidden /> <span className="hidden sm:inline">{r.phone}</span>
              </a>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav aria-label="التنقل بين الصفحات" className="mt-6 flex items-center justify-center gap-2 text-sm">
          {page > 1 && <Link href={href({ page: page - 1 })} className="rounded-control border border-line bg-white px-3 py-1.5 text-navy hover:bg-mist">السابق</Link>}
          <span className="px-2 text-ink/60">صفحة {page.toLocaleString('ar-DZ')} من {pages.toLocaleString('ar-DZ')}</span>
          {page < pages && <Link href={href({ page: page + 1 })} className="rounded-control border border-line bg-white px-3 py-1.5 text-navy hover:bg-mist">التالي</Link>}
        </nav>
      )}
    </>
  );
}
