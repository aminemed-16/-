import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { ServiceIcon } from '@/lib/icons';

export const revalidate = 300;
export const metadata: Metadata = { title: 'الخدمات', description: 'خدمات أكاديمية لينورين: دورات تكوينية، تعليم اللغات، ورشات فنية، وشهادات معتمدة.' };

export default async function ServicesPage() {
  const supabase = await createClient();
  const { data: services } = await supabase.from('services').select('id, title, description, icon_key').eq('is_visible', true).order('sort_order');

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-navy sm:text-4xl">خدماتنا</h1>
        <p className="mx-auto mt-3 max-w-md text-ink/65">برامج متنوعة تواكب احتياجات كل متعلم.</p>
      </div>
      {(services?.length ?? 0) === 0 ? (
        <p className="text-center text-ink/55">سيتم إضافة الخدمات قريباً.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services!.map((s) => (
            <div key={s.id} className="rounded-card border border-line bg-white p-6 shadow-card">
              <div className="mb-3 grid h-12 w-12 place-items-center rounded-control bg-navy/5 text-navy"><ServiceIcon iconKey={s.icon_key} /></div>
              <h2 className="font-bold text-navy">{s.title}</h2>
              {s.description && <p className="mt-2 text-sm leading-6 text-ink/65">{s.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
