import { z } from 'zod';
import type { ProgramModule } from '@/lib/program';

const emptyToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v);
const optionalText = (max: number) => z.string().trim().max(max, `الحد الأقصى ${max} حرفاً.`);

export type CourseFormState = { error?: string; fieldErrors?: Record<string, string> };

/**
 * "Program content" is edited as plain text so non-technical admins can use it:
 *   Module title
 *   Item
 *   Item
 *   (blank line)
 *   Next module...
 */
export function parseProgram(text: string): ProgramModule[] {
  return text
    .replace(/\r/g, '')
    .split(/\n\s*\n/)
    .map((block) => block.split('\n').map((l) => l.trim()).filter(Boolean))
    .filter((lines) => lines.length > 0)
    .slice(0, 40)
    .map(([title, ...items]) => ({ title: title!.slice(0, 120), items: items.slice(0, 40).map((i) => i.slice(0, 200)) }));
}

export function randomSlug() {
  return `course-${Math.random().toString(36).slice(2, 8)}`;
}

const schema = z.object({
  title: z.string().trim().min(3, 'اكتب عنواناً من 3 أحرف على الأقل.').max(150, 'الحد الأقصى 150 حرفاً.'),
  slug: z
    .string().trim().toLowerCase().max(80)
    .regex(/^([a-z0-9]+(-[a-z0-9]+)*)?$/, 'استعمل أحرفاً لاتينية صغيرة وأرقاماً وشرطات فقط، مثل french-a1.'),
  short_description: optionalText(300),
  description: optionalText(10000),
  category_id: z.preprocess(emptyToNull, z.string().uuid().nullable()),
  trainer_id: z.preprocess(emptyToNull, z.string().uuid().nullable()),
  price_dzd: z.preprocess(emptyToNull, z.coerce.number({ invalid_type_error: 'أدخل رقماً صحيحاً.' }).min(0, 'السعر لا يكون سالباً.').max(10_000_000).nullable()),
  show_price: z.boolean(),
  duration_text: optionalText(100),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'all_levels']),
  location: optionalText(150),
  study_mode: z.enum(['onsite', 'online', 'hybrid']),
  registration: z.enum(['open', 'closed', 'soon', 'full']),
  has_certificate: z.boolean(),
  certificate_note: optionalText(300),
  seo_title: optionalText(70),
  seo_description: optionalText(170),
  cover_media_id: z.preprocess(emptyToNull, z.string().uuid().nullable()),
});

export function parseCourseForm(fd: FormData):
  | { ok: true; data: Record<string, unknown> & { slug: string } }
  | { ok: false; fieldErrors: Record<string, string> } {
  const text = (k: string) => (typeof fd.get(k) === 'string' ? (fd.get(k) as string) : '');
  const keys = [
    'title', 'slug', 'short_description', 'description', 'category_id', 'trainer_id', 'price_dzd',
    'duration_text', 'level', 'location', 'study_mode', 'registration', 'certificate_note',
    'seo_title', 'seo_description', 'cover_media_id',
  ];
  const raw: Record<string, unknown> = Object.fromEntries(keys.map((k) => [k, text(k)]));
  raw.show_price = fd.get('show_price') === 'on';
  raw.has_certificate = fd.get('has_certificate') === 'on';

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { ok: false, fieldErrors };
  }

  const keywords = [...new Set(text('seo_keywords').split(/[,،]/).map((k) => k.trim()).filter(Boolean))]
    .map((k) => k.slice(0, 40)).slice(0, 15);

  return {
    ok: true,
    data: { ...parsed.data, program_content: parseProgram(text('program_content')), seo_keywords: keywords },
  };
}
