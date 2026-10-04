import { z } from 'zod';

/** Algerian numbers: 05/06/07 mobiles and landlines, with or without +213 / 00213, spaces or dashes. */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/[\s.\-()]/g, '');
  const m = /^(?:\+213|00213|0)([1-9]\d{7,8})$/.exec(digits);
  return m ? `0${m[1]}` : null;
}

/** wa.me link for mobile numbers only (05/06/07); null otherwise. */
export function whatsappLink(phone: string): string | null {
  return /^0[567]\d{8}$/.test(phone) ? `https://wa.me/213${phone.slice(1)}` : null;
}

const text = (min: number, max: number, msg: string) =>
  z.string().trim().min(min, msg).max(max, `الحد الأقصى ${max} حرفاً.`);

export const publicRegistrationSchema = z.object({
  full_name: text(3, 100, 'اكتب الاسم واللقب.'),
  phone: z.string().trim().transform((v, ctx) => {
    const n = normalizePhone(v);
    if (!n) ctx.addIssue({ code: 'custom', message: 'رقم الهاتف غير صحيح. مثال: 0551 23 45 67' });
    return n ?? '';
  }),
  email: z.preprocess((v) => (v === '' ? null : v), z.string().trim().toLowerCase().email('البريد الإلكتروني غير صحيح.').max(254).nullable().optional()),
  wilaya: text(2, 60, 'اختر الولاية.'),
  commune: z.string().trim().max(80).optional().default(''),
  notes: z.string().trim().max(1000, 'الحد الأقصى 1000 حرف.').optional().default(''),
  course_id: z.string().uuid().nullable().optional(),
  website: z.string().max(200).optional().default(''),   // honeypot: real users never fill it
});

export const registrationStatuses = ['new', 'in_review', 'contacted', 'accepted', 'rejected', 'postponed'] as const;

export const adminRegistrationSchema = z.object({
  status: z.enum(registrationStatuses),
  internal_notes: z.string().trim().max(2000, 'الحد الأقصى 2000 حرف.'),
});

export type RegistrationFormState = { error?: string; ok?: boolean; fieldErrors?: Record<string, string> };
