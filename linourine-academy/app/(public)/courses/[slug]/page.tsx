import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Award, CheckCircle2, Clock, MapPin, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPublicSettings } from '@/lib/settings';
import { getClientIp, hashValue } from '@/lib/hash';
import { levelLabels, modeLabels, registrationLabels } from '@/lib/labels';
import { RegistrationForm } from '@/components/public/registration-form';

export const revalidate = 120;

type ProgramModule = { title: string; items: string[] };
type Course = {
  id: string; slug: string; title: string; short_description: string | null; description: string | null;
  price_dzd: number | null; show_price: boolean; duration_text: string | null; level: keyof typeof levelLabels;
  location: string | null; study_mode: keyof typeof modeLabels; registration: keyof typeof registrationLabels;
  has_certificate: boolean; certificate_note: string | null; program_content: ProgramModule[];
  seo_title: string | null; seo_description: string | null; seo_keywords: string[];
  course_categories: { name: string } | null; trainers: { full_name: string; job_title: string | null; bio: string | null } | null;
  cover: { url: string; alt_text: string | null } | null; og: { url: string } | null;
};

async function getCourse(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('courses')
    .select(`id, slug, title, short_description, description, price_dzd, show_price, duration_text, level,
              location, study_mode, registration, has_certificate, certificate_note, program_content,
              seo_title, seo_description, seo_keywords, course_categories(name), trainers(full_name, job_title, bio),
              cover:cover_media_id(url, alt_text), og:og_media_id(url)`)
    .eq('slug', slug).eq('status', 'published').maybeSingle();
  return data as unknown as Course | null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const course = await getCourse((await params).slug);
  if (!course) return {};
  const description = course.seo_description || course.short_description || undefined;
  return {
    title: course.seo_title || course.title,
    description,
    keywords: course.seo_keywords.length ? course.seo_keywords : undefined,
    alternates: { canonical: `/courses/${course.slug}` },
    openGraph: { title: course.seo_title || course.title, description, type: 'website', images: (course.og?.url || course.cover?.url) ? [course.og?.url || course.cover!.url] : undefined },
  };
}

export default async function CourseLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [course, settings] = await Promise.all([getCourse(slug), getPublicSettings()]);
  if (!course) notFound();

  const supabase = await createClient();
  const [{ data: faqRows }, { data: testimonialRows }] = await Promise.all([
    supabase.from('faq').select('question, answer').eq('course_id', course.id).eq('is_visible', true).order('sort_order'),
    supabase.from('testimonials').select('author_name, author_role, content, rating').eq('course_id', course.id).eq('status', 'published').order('sort_order'),
  ]);

  // Fire-and-forget analytics: never block or fail the page render.
  createAdminClient()
    .from('page_views')
    .insert({ path: `/courses/${course.slug}`, course_id: course.id, visitor_hash: hashValue(`${new Date().toISOString().slice(0, 10)}:${await getClientIp()}`) })
    .then(() => {}, () => {});

  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Course', name: course.title,
    description: course.short_description ?? course.description ?? undefined,
    provider: { '@type': 'Organization', name: settings.site.name, sameAs: settings.social.map((s) => s.url) },
  };
  const isOpen = course.registration === 'open';

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="relative overflow-hidden bg-navy text-white">
        <div aria-hidden className="pointer-events-none absolute -top-24 -end-24 h-80 w-80 rounded-full bg-magenta/20 blur-3xl" />
        {course.cover?.url && (
          <img src={course.cover.url} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-20" />
        )}
        <div className="relative mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
          {course.course_categories?.name && <p className="mb-2 text-sm font-semibold text-white/60">{course.course_categories.name}</p>}
          <h1 className="max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">{course.title}</h1>
          {course.short_description && <p className="mt-4 max-w-xl text-white/75">{course.short_description}</p>}
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
            {course.duration_text && <span className="flex items-center gap-1.5"><Clock size={15} aria-hidden /> {course.duration_text}</span>}
            {course.location && <span className="flex items-center gap-1.5"><MapPin size={15} aria-hidden /> {course.location}</span>}
            <span className="flex items-center gap-1.5"><Users size={15} aria-hidden /> {modeLabels[course.study_mode]}</span>
            {course.has_certificate && <span className="flex items-center gap-1.5"><Award size={15} aria-hidden /> شهادة في نهاية التكوين</span>}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-10">
          {course.description && (
            <section>
              <h2 className="mb-3 text-xl font-bold text-navy">نبذة عن الدورة</h2>
              <p className="whitespace-pre-line leading-7 text-ink/75">{course.description}</p>
            </section>
          )}

          {course.program_content.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-bold text-navy">محتوى البرنامج</h2>
              <div className="space-y-3">
                {course.program_content.map((m, i) => (
                  <details key={i} className="group rounded-card border border-line bg-white open:shadow-card" open={i === 0}>
                    <summary className="flex cursor-pointer items-center justify-between p-4 font-semibold text-navy">
                      {m.title}
                      <span aria-hidden className="text-ink/40 transition-transform group-open:rotate-180">⌄</span>
                    </summary>
                    {m.items.length > 0 && (
                      <ul className="space-y-2 border-t border-line p-4 pt-3">
                        {m.items.map((it, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-ink/75">
                            <CheckCircle2 size={16} aria-hidden className="mt-0.5 shrink-0 text-royal" /> {it}
                          </li>
                        ))}
                      </ul>
                    )}
                  </details>
                ))}
              </div>
            </section>
          )}

          {course.trainers && (
            <section>
              <h2 className="mb-3 text-xl font-bold text-navy">المدرب</h2>
              <div className="flex items-start gap-4 rounded-card border border-line bg-white p-5 shadow-card">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-navy/10 font-bold text-navy" aria-hidden>
                  {course.trainers.full_name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-navy">{course.trainers.full_name}</p>
                  {course.trainers.job_title && <p className="text-sm text-ink/55">{course.trainers.job_title}</p>}
                  {course.trainers.bio && <p className="mt-2 text-sm leading-6 text-ink/70">{course.trainers.bio}</p>}
                </div>
              </div>
            </section>
          )}

          {course.has_certificate && (
            <section className="flex items-start gap-3 rounded-card border border-line bg-blush p-5">
              <Award size={22} aria-hidden className="mt-0.5 shrink-0 text-magenta" />
              <div>
                <p className="font-bold text-navy">شهادة معتمدة</p>
                <p className="mt-1 text-sm leading-6 text-ink/70">{course.certificate_note || 'تحصل على شهادة عند إتمام الدورة بنجاح.'}</p>
              </div>
            </section>
          )}

          {(testimonialRows?.length ?? 0) > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-bold text-navy">آراء المتدربين</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {testimonialRows!.map((t, i) => (
                  <blockquote key={i} className="rounded-card border border-line bg-white p-5 shadow-card">
                    <p className="text-sm leading-6 text-ink/75">{t.content}</p>
                    <footer className="mt-3 text-sm font-semibold text-navy">
                      {t.author_name}{t.author_role && <span className="font-normal text-ink/50"> — {t.author_role}</span>}
                    </footer>
                  </blockquote>
                ))}
              </div>
            </section>
          )}

          {(faqRows?.length ?? 0) > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-bold text-navy">الأسئلة الشائعة</h2>
              <div className="space-y-3">
                {faqRows!.map((f, i) => (
                  <details key={i} className="rounded-card border border-line bg-white">
                    <summary className="cursor-pointer p-4 font-semibold text-navy">{f.question}</summary>
                    <p className="border-t border-line p-4 pt-3 text-sm leading-6 text-ink/70">{f.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-card border border-line bg-white p-5 shadow-card sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-navy">{isOpen ? 'سجل اهتمامك بالدورة' : registrationLabels[course.registration]}</h2>
              {course.show_price && course.price_dzd !== null && (
                <span className="font-bold text-magenta">{course.price_dzd.toLocaleString('ar-DZ')} دج</span>
              )}
            </div>
            {isOpen ? (
              <RegistrationForm courseId={course.id} courseTitle={course.title} defaultWilaya={settings.registration.defaultWilaya} />
            ) : (
              <p className="text-sm leading-6 text-ink/65">
                {course.registration === 'soon' ? 'التسجيل في هذه الدورة سيُفتح قريباً. تابعنا لمعرفة الموعد.' : 'التسجيل في هذه الدورة غير متاح حالياً.'}
              </p>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
