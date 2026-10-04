'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, Textarea } from '@/components/ui/field';
import { wilayas } from '@/lib/wilayas';
import type { SettingsFormState } from '@/lib/validation/settings';
import { updateSettings } from '@/app/admin/(dashboard)/settings/actions';

export type SettingsValues = Record<string, string>;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-5 rounded-card border border-line bg-white p-5 shadow-card sm:p-6">
      <h2 className="font-bold text-navy">{title}</h2>
      {children}
    </section>
  );
}

export function SettingsForm({ values }: { values: SettingsValues }) {
  const [state, formAction, pending] = useActionState<SettingsFormState, FormData>(updateSettings, {});
  const err = state.fieldErrors ?? {};
  const v = (k: string) => values[k] ?? '';

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-2">
      {state.error && <p role="alert" className="lg:col-span-2 rounded-control bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>}
      {state.ok && <p role="status" className="lg:col-span-2 rounded-control bg-emerald-50 px-4 py-3 text-sm text-emerald-800">تم حفظ الإعدادات.</p>}

      <Section title="هوية الموقع">
        <Input label="اسم الأكاديمية" name="site.name" defaultValue={v('site.name')} error={err['site.name']} required />
        <Input label="الاسم باللاتينية" name="site.name_latin" dir="ltr" defaultValue={v('site.name_latin')} />
        <Input label="الشعار النصي" name="site.tagline" defaultValue={v('site.tagline')} />
        <Textarea label="وصف الأكاديمية" name="site.description" defaultValue={v('site.description')} className="min-h-28" />
      </Section>

      <Section title="معلومات التواصل">
        <Input label="الهاتف" name="contact.phone" dir="ltr" defaultValue={v('contact.phone')} />
        <Input label="واتساب" name="contact.whatsapp" dir="ltr" defaultValue={v('contact.whatsapp')} hint="بالصيغة الدولية، مثال 213551778717+" />
        <Input label="البريد الإلكتروني" name="contact.email" type="email" dir="ltr" defaultValue={v('contact.email')} error={err['contact.email']} />
        <Input label="العنوان" name="contact.address" defaultValue={v('contact.address')} />
        <Input label="رابط خرائط Google" name="contact.maps_url" dir="ltr" defaultValue={v('contact.maps_url')} error={err['contact.maps_url']} />
        <Select label="الولاية الافتراضية في نموذج التسجيل" name="registration.default_wilaya" defaultValue={v('registration.default_wilaya') || 'غليزان'}>
          {wilayas.map((w) => <option key={w} value={w}>{w}</option>)}
        </Select>
      </Section>

      <Section title="روابط التواصل الاجتماعي">
        <Input label="فيسبوك" name="social.facebook" dir="ltr" defaultValue={v('social.facebook')} error={err['social.facebook']} />
        <Input label="إنستغرام" name="social.instagram" dir="ltr" defaultValue={v('social.instagram')} error={err['social.instagram']} />
        <Input label="تيك توك" name="social.tiktok" dir="ltr" defaultValue={v('social.tiktok')} error={err['social.tiktok']} />
        <Input label="يوتيوب" name="social.youtube" dir="ltr" defaultValue={v('social.youtube')} error={err['social.youtube']} />
      </Section>

      <Section title="تذييل الصفحة (Footer)">
        <Textarea label="نبذة مختصرة" name="footer.about" defaultValue={v('footer.about')} className="min-h-24" />
        <Input label="نص الحقوق" name="footer.copyright" defaultValue={v('footer.copyright')} />
      </Section>

      <Section title="من نحن">
        <Textarea label="الرؤية" name="about.vision" defaultValue={v('about.vision')} className="min-h-24" />
        <Textarea label="الرسالة" name="about.mission" defaultValue={v('about.mission')} className="min-h-24" />
        <Textarea label="الأهداف" name="about.goals" defaultValue={v('about.goals')} className="min-h-24" hint="سطر واحد لكل هدف." />
        <Textarea label="القيم" name="about.values" defaultValue={v('about.values')} className="min-h-24" hint="سطر واحد لكل قيمة." />
      </Section>

      <Section title="SEO وتحليلات">
        <Input label="عنوان SEO الافتراضي" name="seo.default_title" defaultValue={v('seo.default_title')} />
        <Textarea label="وصف SEO الافتراضي" name="seo.default_description" defaultValue={v('seo.default_description')} className="min-h-20" />
        <Input label="معرّف Google Analytics" name="analytics.ga_id" dir="ltr" defaultValue={v('analytics.ga_id')} placeholder="G-XXXXXXXXXX" />
        <Input label="معرّف Meta Pixel" name="analytics.meta_pixel_id" dir="ltr" defaultValue={v('analytics.meta_pixel_id')} />
      </Section>

      <div className="lg:col-span-2">
        <Button type="submit" size="lg" loading={pending}>حفظ الإعدادات</Button>
      </div>
    </form>
  );
}
