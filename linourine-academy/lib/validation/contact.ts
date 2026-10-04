import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'اكتب اسمك.').max(100),
  phone: z.preprocess((v) => (v === '' ? null : v), z.string().trim().max(20).nullable().optional()),
  email: z.preprocess((v) => (v === '' ? null : v), z.string().trim().toLowerCase().email('البريد الإلكتروني غير صحيح.').max(254).nullable().optional()),
  subject: z.string().trim().max(150).optional().default(''),
  message: z.string().trim().min(5, 'اكتب رسالتك.').max(2000, 'الحد الأقصى 2000 حرف.'),
  website: z.string().max(200).optional().default(''),
});
