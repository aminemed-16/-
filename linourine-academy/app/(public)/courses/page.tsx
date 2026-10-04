import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { levelLabels, registrationLabels } from '@/lib/labels';
import { cn } from '@/lib/cn';

export const revalidate = 120;
export const metadata: Metadata = { title: 'الدورات', description: 'اكتشف دورات أكاديمية لينورين التكوينية واللغوية والفنية في غليزان.' };

type Category = { id: string; slug: string; name: string };
type Course = {
  id: string; slug: string; title: string; short_description: string | null; level: keyof typeof levelLabels;
  duration_text: string | null; registration: keyof typeof registrationLabels;
  course_categories: { name: string } | null; media: { url: string; alt_text: string | null } | null;
};

export default async function CoursesPage({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const { cat } = await searchParams;
  const supabase = await createClient();

  const [{ data: categories }, coursesQuery] = await Promise.all([
    supabase.from('course_categories').select('id, slug, name').eq('is_visible', true).order('sort_order'),
    (async () => {
      let q = supabase
        .from('courses')
        .select('id, slug, title, short_description, level, duration_text, registration, course_categories(name), media:cover_media_id(url, alt_text)')
        .eq('status', 'published')
        .order('published_at', { ascending: false });
      if (cat) {
        const { data: c } = await supabase.from('course_categories').select('id').eq('slug', cat).maybeSingle();
        q = c ? q.eq('category_id', c.id) : q.eq('category_id', '00000000-0000-0000-0000-000000000000');
      }
      return q;
    })(),
  ]);

  const courses = (coursesQuery.data ?? []) as unknown as Course[];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-navy sm:text-4xl">دوراتنا التكوينية</h1>
        <p className="mx-auto mt-3 max-w-xl text-ink/65">اختر الدورة المناسبة لك واطلب التسجيل في دقيقة واحدة.</p>
      </div>

      {(categories?.length ?? 0) > 0 && (
        <nav aria-label="تصفية حسب التصنيف" className="mb-8 flex flex-wrap justify-center gap-2">
          <Link href="/courses" aria-current={!cat ? 'page' : undefined}
            className={cn('rounded-full px-4 py-2 text-sm font-medium transition-colors', !cat ? 'bg-navy text-white' : 'bg-white text-ink/70 ring-1 ring-line hover:bg-navy/5')}>
            الكل
          </Link>
          {(categories as Category[]).map((c) => (
            <Link key={c.id} href={`/courses?cat=${c.slug}`} aria-current={cat === c.slug ? 'page' : undefined}
              className={cn('rounded-full px-4 py-2 text-sm font-medium transition-colors', cat === c.slug ? 'bg-navy text-white' : 'bg-white text-ink/70 ring-1 ring-line hover:bg-navy/5')}>
              {c.name}
            </Link>
          ))}
        </nav>
      )}

      {courses.length === 0 ? (
        <div className="rounded-card border border-dashed border-line bg-white p-12 text-center text-ink/60">
          لا توجد دورات متاحة في هذا التصنيف حالياً.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <Link key={c.id} href={`/courses/${c.slug}`} className="group flex flex-col rounded-card border border-line bg-white p-5 shadow-card transition-shadow hover:shadow-md">
              {c.media?.url ? (
                <img src={c.media.url} alt={c.media.alt_text ?? ''} loading="lazy"
                  className="mb-3 h-36 w-full rounded-control object-cover" />
              ) : (
                <div className="mb-3 h-36 rounded-control bg-gradient-to-br from-royal/10 to-magenta/10" aria-hidden />
              )}
              {c.course_categories?.name && <p className="mb-1.5 text-xs font-semibold text-magenta">{c.course_categories.name}</p>}
              <h2 className="font-bold text-navy group-hover:underline">{c.title}</h2>
              {c.short_description && <p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-6 text-ink/65">{c.short_description}</p>}
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-ink/50">{[levelLabels[c.level], c.duration_text].filter(Boolean).join(' • ')}</span>
                <span className={cn('font-semibold', c.registration === 'open' ? 'text-emerald-600' : 'text-ink/40')}>
                  {registrationLabels[c.registration]}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
