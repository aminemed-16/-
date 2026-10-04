import type { Metadata } from 'next';
import { Mail, MapPin, Phone } from 'lucide-react';
import { getPublicSettings } from '@/lib/settings';
import { ContactForm } from '@/components/public/contact-form';
import { SocialIcon } from '@/components/public/social-icon';

export const metadata: Metadata = { title: 'تواصل معنا', description: 'تواصل مع أكاديمية لينورين في غليزان.' };

export default async function ContactPage() {
  const s = await getPublicSettings();
  const items = [
    s.contact.phone && [Phone, s.contact.phone, `tel:${s.contact.phone.replace(/\s/g, '')}`] as const,
    s.contact.email && [Mail, s.contact.email, `mailto:${s.contact.email}`] as const,
    s.contact.address && [MapPin, s.contact.address, s.contact.mapsUrl || undefined] as const,
  ].filter(Boolean) as Array<readonly [typeof Phone, string, string | undefined]>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-navy sm:text-4xl">تواصل معنا</h1>
        <p className="mx-auto mt-3 max-w-md text-ink/65">يسعدنا الإجابة عن أسئلتك ومساعدتك في اختيار الدورة المناسبة.</p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-5">
          {items.length === 0 && <p className="text-sm text-ink/55">سيتم إضافة معلومات التواصل قريباً.</p>}
          {items.map(([Icon, text, href], i) => (
            <div key={i} className="flex items-start gap-3 rounded-card border border-line bg-white p-4 shadow-card">
              <Icon size={18} aria-hidden className="mt-0.5 shrink-0 text-royal" />
              {href ? <a href={href} dir="ltr" className="text-sm text-ink/80 hover:text-navy">{text}</a> : <span className="text-sm text-ink/80">{text}</span>}
            </div>
          ))}
          {s.social.length > 0 && (
            <div className="flex gap-2 pt-2">{s.social.map((l) => <SocialIcon key={l.platform} platform={l.platform} url={l.url} />)}</div>
          )}
        </div>

        <div className="rounded-card border border-line bg-white p-5 shadow-card sm:p-6">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
