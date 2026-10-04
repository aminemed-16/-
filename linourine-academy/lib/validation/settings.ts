import { z } from 'zod';

const text = (max: number) => z.string().trim().max(max);
const url = (max = 300) => z.string().trim().max(max).refine((v) => v === '' || /^https?:\/\//i.test(v), 'الرابط يجب أن يبدأ بـ http:// أو https://');
const lines = (raw: string) => raw.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 20);

export const settingsSchema = z.object({
  'site.name': text(100).min(2, 'اسم الأكاديمية مطلوب.'),
  'site.name_latin': text(100),
  'site.tagline': text(200),
  'site.description': text(2000),
  'contact.phone': text(30),
  'contact.whatsapp': text(30),
  'contact.email': z.string().trim().max(254).refine((v) => v === '' || z.string().email().safeParse(v).success, 'البريد الإلكتروني غير صحيح.'),
  'contact.address': text(300),
  'contact.maps_url': url(),
  'registration.default_wilaya': text(60).min(1, 'اختر ولاية افتراضية.'),
  'footer.about': text(500),
  'footer.copyright': text(200),
  'seo.default_title': text(70),
  'seo.default_description': text(170),
  'analytics.ga_id': text(30),
  'analytics.meta_pixel_id': text(30),
  'about.vision': text(1000),
  'about.mission': text(1000),
  'about.goals': z.string().transform(lines),
  'about.values': z.string().transform(lines),
  'social.facebook': url(),
  'social.instagram': url(),
  'social.tiktok': url(),
  'social.youtube': url(),
});

export type SettingsFormState = { error?: string; ok?: boolean; fieldErrors?: Record<string, string> };
