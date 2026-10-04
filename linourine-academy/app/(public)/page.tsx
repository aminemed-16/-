import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getPublicSettings } from '@/lib/settings';
import { ServiceIcon } from '@/lib/icons';
import { levelLabels } from '@/lib/labels';

export const revalidate = 300;
export async function generateMetadata(): Promise<Metadata> {
  const s = await getPublicSettings();
  return { title: s.seo.defaultTitle || undefined, description: s.seo.defaultDescription || s.site.tagline };
}

type Service = { id: string; title: string; description: string | null; icon_key: string | null };
type Course = { id: string; slug: string; title: string; short_description: string | null; level: keyof typeof levelLabels; duration_text: string | null; media: { url: string; alt_text: string | null } | null };

const stat = (label: string, value: number | null) =>
  value !== null && (
    <div key={label} className="text-center">
      <div className="text-3xl font-bold text-navy sm:text-4xl">+{value.toLocaleString('ar-DZ')}</div>
      <div className="mt-1 text-sm text-ink/60">{label}</div>
    </div>
  );

export default async function HomePage() {
  const supabase = await createClient();
  const settings = await getPublicSettings();
  const [{ data: services }, { data: courses }] = await Promise.all([
    supabase.from('services').select('id, title, description, icon_key').eq('is_visible', true).order('sort_order').limit(7),
    supabase.from('courses').select('id, slug, title, short_description, level, duration_text, media:cover_media_id(url, alt_text)').eq('status', 'published').order('published_at', { ascending: false }).limit(3),
  ]);

  const stats = [
    ['طالب', settings.stats.students], ['دورة', settings.stats.courses],
    ['مدرب', settings.stats.trainers], ['شهادة', settings.stats.certificates],
  ] as const;
  const hasStats = stats.some(([, v]) => v !== null);

  return (
    <>
      <section className="relative overflow-hidden bg-blush">
        <div aria-hidden className="pointer-events-none absolute -top-32 -end-32 h-96 w-96 rounded-full bg-magenta/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -start-24 h-80 w-80 rounded-full bg-royal/10 blur-3xl" />
        <div className="relative mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <p className="mb-3 text-sm font-semibold tracking-wide text-magenta">أكاديمية لينورين — غليزان</p>
          <h1 className="text-balance text-4xl font-bold leading-tight text-navy sm:text-5xl">{settings.site.tagline}</h1>
          {settings.site.description && <p className="mx-auto mt-5 max-w-xl text-ink/70">{settings.site.description}</p>}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/courses" className="inline-flex h-12 items-center rounded-control bg-navy px-6 font-semibold text-white hover:bg-navy/90">اكتشف الدورات</Link>
            <Link href="/courses" className="inline-flex h-12 items-center rounded-control border border-navy/15 bg-white px-6 font-semibold text-navy hover:bg-navy/5">سجل الآن</Link>
          </div>
        </div>
      </section>

      {hasStats && (
        <section className="border-y border-line bg-white">
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 px-4 py-10 sm:px-6 md:grid-cols-4">
            {stats.map(([label, value]) => stat(label, value))}
          </div>
        </section>
      )}

      {services && services.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="text-center text-2xl font-bold text-navy sm:text-3xl">الخدمات التي نقدمها</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(services as Service[]).map((s) => (
              <div key={s.id} className="rounded-card border border-line bg-white p-5 shadow-card transition-shadow hover:shadow-md">
                <div className="mb-3 grid h-11 w-11 place-items-center rounded-control bg-navy/5 text-navy">
                  <ServiceIcon iconKey={s.icon_key} />
                </div>
                <h3 className="font-bold text-navy">{s.title}</h3>
                {s.description && <p className="mt-1.5 text-sm leading-6 text-ink/65">{s.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {settings.about.strengths.length > 0 && (
        <section className="bg-navy py-16 text-white sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-2xl font-bold sm:text-3xl">لماذا أكاديمية لينورين؟</h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {settings.about.strengths.map((s) => (
                <div key={s.title} className="rounded-card bg-white/5 p-5">
                  <h3 className="font-bold">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-white/70">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {courses && courses.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-2xl font-bold text-navy sm:text-3xl">اكتشف عروضنا</h2>
            <Link href="/courses" className="inline-flex items-center gap-1.5 text-sm font-semibold text-royal hover:underline">
              كل الدورات <ArrowLeft size={16} aria-hidden className="rtl:rotate-180" />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(courses as Course[]).map((c) => (
              <Link key={c.id} href={`/courses/${c.slug}`} className="group rounded-card border border-line bg-white p-5 shadow-card transition-shadow hover:shadow-md">
                {c.media?.url ? (
                  <img src={c.media.url} alt={c.media.alt_text ?? ''} loading="lazy" className="mb-3 h-36 w-full rounded-control object-cover" />
                ) : (
                  <div className="mb-3 h-36 rounded-control bg-gradient-to-br from-royal/10 to-magenta/10" aria-hidden />
                )}
                <h3 className="font-bold text-navy group-hover:underline">{c.title}</h3>
                {c.short_description && <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-ink/65">{c.short_description}</p>}
                <p className="mt-3 text-xs text-ink/50">{[levelLabels[c.level], c.duration_text].filter(Boolean).join(' • ')}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="bg-blush py-16 text-center sm:py-20">
        <h2 className="text-2xl font-bold text-navy sm:text-3xl">جاهز للانطلاق؟</h2>
        <p className="mx-auto mt-3 max-w-md text-ink/70">سجل اهتمامك اليوم وسيتواصل معك فريقنا لإتمام التسجيل.</p>
        <Link href="/courses" className="mt-6 inline-flex h-12 items-center rounded-control bg-magenta px-7 font-semibold text-white hover:bg-magenta/90">
          سجل الآن
        </Link>
      </section>
    </>
  );
}
