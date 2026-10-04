import type { Metadata } from 'next';
import { getPublicSettings } from '@/lib/settings';

export const metadata: Metadata = { title: 'من نحن', description: 'تعرف على أكاديمية لينورين في غليزان: رؤيتنا ورسالتنا ونقاط قوتنا.' };

export default async function AboutPage() {
  const s = await getPublicSettings();
  const blocks = [['رؤيتنا', s.about.vision], ['رسالتنا', s.about.mission]] as const;

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-navy sm:text-4xl">من نحن</h1>
        <p className="mx-auto mt-3 max-w-xl text-ink/65">{s.site.tagline}</p>
      </div>

      {s.site.description && <p className="mb-10 whitespace-pre-line leading-7 text-ink/75">{s.site.description}</p>}

      <div className="grid gap-5 sm:grid-cols-2">
        {blocks.filter(([, v]) => v).map(([title, text]) => (
          <div key={title} className="rounded-card border border-line bg-white p-6 shadow-card">
            <h2 className="mb-2 font-bold text-navy">{title}</h2>
            <p className="text-sm leading-7 text-ink/70">{text}</p>
          </div>
        ))}
      </div>

      {s.about.strengths.length > 0 && (
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {s.about.strengths.map((st) => (
            <div key={st.title} className="rounded-card border border-line bg-blush p-5">
              <h3 className="font-bold text-navy">{st.title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-ink/70">{st.text}</p>
            </div>
          ))}
        </div>
      )}

      {(s.about.values.length > 0 || s.about.goals.length > 0) && (
        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          {s.about.goals.length > 0 && (
            <div><h2 className="mb-3 font-bold text-navy">أهدافنا</h2>
              <ul className="list-inside list-disc space-y-1.5 text-sm text-ink/70">{s.about.goals.map((g, i) => <li key={i}>{g}</li>)}</ul></div>
          )}
          {s.about.values.length > 0 && (
            <div><h2 className="mb-3 font-bold text-navy">قيمنا</h2>
              <ul className="list-inside list-disc space-y-1.5 text-sm text-ink/70">{s.about.values.map((v, i) => <li key={i}>{v}</li>)}</ul></div>
          )}
        </div>
      )}
    </div>
  );
}
