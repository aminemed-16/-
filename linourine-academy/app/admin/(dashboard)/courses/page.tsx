import type { Metadata } from 'next';
import Link from 'next/link';
import { Pencil, Plus, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Notice, PageHeader } from '@/components/admin/page-header';
import { ConfirmDeleteButton } from '@/components/admin/confirm-delete';
import { deleteCourse } from './actions';
import { can, requirePermission } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { levelLabels, registrationLabels, statusLabels } from '@/lib/labels';
import { cn } from '@/lib/cn';

export const metadata: Metadata = { title: 'الدورات' };

const PAGE_SIZE = 10;
const tabs = [
  { key: '', label: 'الكل' },
  { key: 'published', label: 'منشورة' },
  { key: 'draft', label: 'مسودات' },
  { key: 'unpublished', label: 'غير منشورة' },
] as const;
const tone = { draft: 'neutral', published: 'success', unpublished: 'warning' } as const;

type Row = {
  id: string; title: string; slug: string; status: keyof typeof statusLabels; level: keyof typeof levelLabels;
  registration: keyof typeof registrationLabels; updated_at: string; course_categories: { name: string } | null;
};

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string; saved?: string; deleted?: string; error?: string }>;
}) {
  const ctx = await requirePermission('view_courses');
  const sp = await searchParams;
  const q = (sp.q ?? '').replace(/[%_\\,()]/g, ' ').trim().slice(0, 80);
  const status = tabs.some((t) => t.key === sp.status && t.key) ? sp.status! : '';
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1);

  const supabase = await createClient();
  let query = supabase
    .from('courses')
    .select('id, title, slug, status, level, registration, updated_at, course_categories(name)', { count: 'exact' })
    .order('updated_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (status) query = query.eq('status', status);
  if (q) query = query.ilike('title', `%${q}%`);

  const { data, count, error } = await query;
  const rows = (data ?? []) as unknown as Row[];
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const href = (p: Record<string, string | number>) => {
    const params = new URLSearchParams();
    const merged = { q, status, page: 1, ...p };
    Object.entries(merged).forEach(([k, v]) => { if (v && !(k === 'page' && v === 1)) params.set(k, String(v)); });
    const s = params.toString();
    return `/admin/courses${s ? `?${s}` : ''}`;
  };
  const date = new Intl.DateTimeFormat('ar-DZ', { dateStyle: 'medium' });

  return (
    <>
      <PageHeader
        title="الدورات"
        description={`${total.toLocaleString('ar-DZ')} دورة`}
        actions={can(ctx, 'create_courses') && (
          <Link href="/admin/courses/new" className="inline-flex h-11 items-center gap-2 rounded-control bg-navy px-5 text-sm font-semibold text-white hover:bg-navy/90">
            <Plus size={18} aria-hidden /> إضافة دورة
          </Link>
        )}
      />

      {sp.deleted && <Notice>تم حذف الدورة.</Notice>}
      {sp.error === 'delete' && <Notice tone="error">تعذر حذف الدورة. حاول مرة أخرى.</Notice>}
      {error && <Notice tone="error">تعذر تحميل الدورات. حدّث الصفحة وحاول مجدداً.</Notice>}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="تصفية حسب الحالة" className="flex flex-wrap gap-1.5">
          {tabs.map((t) => (
            <Link key={t.key} href={href({ status: t.key, page: 1 })} aria-current={status === t.key ? 'page' : undefined}
              className={cn('rounded-full px-3.5 py-1.5 text-sm transition-colors',
                status === t.key ? 'bg-navy text-white' : 'bg-white text-ink/70 hover:bg-navy/5')}>
              {t.label}
            </Link>
          ))}
        </nav>
        <form action="/admin/courses" className="flex items-center gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          <div className="relative">
            <Search size={16} aria-hidden className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink/40" />
            <input name="q" defaultValue={q} placeholder="ابحث باسم الدورة" aria-label="بحث"
              className="h-10 w-56 rounded-control border border-line bg-white ps-9 pe-3 text-sm focus:border-royal focus:outline-none focus:ring-2 focus:ring-royal/20" />
          </div>
          <Button type="submit" variant="outline" size="sm" className="h-10">بحث</Button>
        </form>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-card border border-dashed border-line bg-white p-10 text-center">
          <p className="font-semibold text-navy">{q || status ? 'لا توجد دورات مطابقة' : 'لم تُضف أي دورة بعد'}</p>
          <p className="mt-1 text-sm text-ink/60">
            {q || status ? 'جرّب تغيير البحث أو التصفية.' : 'أضف أول دورة لتظهر في الموقع بعد نشرها.'}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-white shadow-card">
          {rows.map((c) => (
            <li key={c.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/admin/courses/${c.id}`} className="truncate font-semibold text-navy hover:underline">{c.title}</Link>
                  <Badge tone={tone[c.status]}>{statusLabels[c.status]}</Badge>
                </div>
                <p className="text-xs text-ink/55">
                  {[c.course_categories?.name, levelLabels[c.level], registrationLabels[c.registration], `آخر تعديل ${date.format(new Date(c.updated_at))}`]
                    .filter(Boolean).join(' • ')}
                </p>
                <p className="text-xs text-ink/40" dir="ltr">/courses/{c.slug}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                {can(ctx, 'edit_courses') && (
                  <Link href={`/admin/courses/${c.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-control border border-line px-3 text-sm text-navy hover:bg-mist">
                    <Pencil size={15} aria-hidden /> تعديل
                  </Link>
                )}
                {can(ctx, 'delete_courses') && (
                  <ConfirmDeleteButton action={deleteCourse} id={c.id} ariaLabel={`حذف الدورة ${c.title}`}
                    heading="حذف الدورة؟" confirmLabel="نعم، احذف الدورة"
                    body={`سيتم حذف «${c.title}» نهائياً مع صفحتها. طلبات التسجيل المرتبطة بها ستبقى محفوظة باسم الدورة.`} />
                )}
              </div>
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
