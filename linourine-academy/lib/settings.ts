import 'server-only';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

export type PublicSettings = {
  site: { name: string; nameLatin: string; tagline: string; description: string; logoUrl: string | null };
  contact: { phone: string; whatsapp: string; email: string; address: string; mapsUrl: string };
  footer: { about: string; copyright: string };
  theme: { primary: string; secondary: string; accent: string };
  seo: { defaultTitle: string; defaultDescription: string };
  stats: { students: number | null; courses: number | null; trainers: number | null; certificates: number | null };
  about: { vision: string; mission: string; goals: string[]; values: string[]; strengths: Array<{ title: string; text: string }> };
  registration: { defaultWilaya: string };
  social: Array<{ platform: string; url: string }>;
};

const fallback: PublicSettings = {
  site: { name: 'أكاديمية لينورين', nameLatin: 'LINOURINE ACADEMY', tagline: 'تعلم اليوم .. اصنع مستقبلك غداً', description: '', logoUrl: null },
  contact: { phone: '', whatsapp: '', email: '', address: '', mapsUrl: '' },
  footer: { about: '', copyright: '© أكاديمية لينورين. جميع الحقوق محفوظة.' },
  theme: { primary: '#1B2A6B', secondary: '#2D5BD0', accent: '#E6338E' },
  seo: { defaultTitle: 'أكاديمية لينورين', defaultDescription: '' },
  stats: { students: null, courses: null, trainers: null, certificates: null },
  about: { vision: '', mission: '', goals: [], values: [], strengths: [] },
  registration: { defaultWilaya: 'غليزان' },
  social: [],
};

/** Public settings, read with RLS (is_public = true only). Cached per request. */
export const getPublicSettings = cache(async (): Promise<PublicSettings> => {
  const supabase = await createClient();
  const [{ data: rows }, { data: links }] = await Promise.all([
    supabase.from('settings').select('key, value'),
    supabase.from('social_links').select('platform, url').eq('is_visible', true).order('sort_order'),
  ]);

  const v = new Map((rows ?? []).map((r) => [r.key, r.value as unknown]));
  const str = (k: string, d = '') => (typeof v.get(k) === 'string' ? (v.get(k) as string) : d);
  const num = (k: string) => (typeof v.get(k) === 'number' ? (v.get(k) as number) : null);
  const arr = (k: string) => (Array.isArray(v.get(k)) ? (v.get(k) as any[]) : []);

  return {
    site: {
      name: str('site.name', fallback.site.name),
      nameLatin: str('site.name_latin', fallback.site.nameLatin),
      tagline: str('site.tagline', fallback.site.tagline),
      description: str('site.description'),
      logoUrl: null, // resolved from site.logo_media_id once the media library exists
    },
    contact: {
      phone: str('contact.phone'), whatsapp: str('contact.whatsapp'), email: str('contact.email'),
      address: str('contact.address'), mapsUrl: str('contact.maps_url'),
    },
    footer: { about: str('footer.about'), copyright: str('footer.copyright', fallback.footer.copyright) },
    theme: {
      primary: str('theme.primary', fallback.theme.primary),
      secondary: str('theme.secondary', fallback.theme.secondary),
      accent: str('theme.accent', fallback.theme.accent),
    },
    seo: { defaultTitle: str('seo.default_title', fallback.seo.defaultTitle), defaultDescription: str('seo.default_description') },
    stats: { students: num('stats.students'), courses: num('stats.courses'), trainers: num('stats.trainers'), certificates: num('stats.certificates') },
    about: {
      vision: str('about.vision'), mission: str('about.mission'),
      goals: arr('about.goals'), values: arr('about.values'), strengths: arr('about.strengths'),
    },
    registration: { defaultWilaya: str('registration.default_wilaya', fallback.registration.defaultWilaya) },
    social: (links ?? []) as Array<{ platform: string; url: string }>,
  };
});
