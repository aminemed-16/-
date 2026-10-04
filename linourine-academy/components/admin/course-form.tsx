'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox, Select, Textarea } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { MediaPicker } from '@/components/admin/media-picker';
import { levelLabels, modeLabels, registrationLabels, statusLabels } from '@/lib/labels';
import { programToText } from '@/lib/program';
import type { CourseFormState } from '@/lib/validation/course';

export type CourseRow = {
  id: string; slug: string; title: string; short_description: string | null; description: string | null;
  category_id: string | null; trainer_id: string | null; price_dzd: number | null; show_price: boolean;
  duration_text: string | null; level: keyof typeof levelLabels; location: string | null;
  study_mode: keyof typeof modeLabels; registration: keyof typeof registrationLabels;
  has_certificate: boolean; certificate_note: string | null; program_content: unknown;
  status: keyof typeof statusLabels; seo_title: string | null; seo_description: string | null; seo_keywords: string[];
  cover_media_id: string | null; cover_url?: string | null;
};
type MediaItem = { id: string; url: string; alt_text: string | null; mime_type: string };
type Option = { id: string; label: string };

type Props = {
  course?: CourseRow;
  categories: Option[];
  trainers: Option[];
  media: MediaItem[];
  canPublish: boolean;
  action: (prev: CourseFormState, fd: FormData) => Promise<CourseFormState>;
};

const tone = { draft: 'neutral', published: 'success', unpublished: 'warning' } as const;

export function CourseForm({ course, categories, trainers, media, canPublish, action }: Props) {
  const [state, formAction, pending] = useActionState<CourseFormState, FormData>(action, {});
  const err = state.fieldErrors ?? {};
  const isEdit = Boolean(course);
  const status = course?.status;

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {/* Enter key must never trigger publish/unpublish: the first submit button is a safe default. */}
      <button type="submit" name="intent" value={isEdit ? 'save' : 'draft'} className="sr-only" tabIndex={-1} aria-hidden>
        حفظ
      </button>
      {state.error && (
        <p role="alert" className="rounded-control bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <section className="space-y-5 rounded-card border border-line bg-white p-5 shadow-card sm:p-6">
            <h2 className="font-bold text-navy">المعلومات الأساسية</h2>
            <MediaPicker name="cover_media_id" label="الصورة الرئيسية" items={media} initialId={course?.cover_media_id} initialUrl={course?.cover_url} />
            <Input label="اسم الدورة" name="title" defaultValue={course?.title} error={err.title} required />
            <Input
              label="رابط الدورة (Slug)" name="slug" dir="ltr" defaultValue={course?.slug} error={err.slug}
              placeholder="french-a1"
              hint={isEdit && status === 'published'
                ? 'تنبيه: تغيير الرابط يكسر الروابط المنشورة سابقاً.'
                : 'أحرف لاتينية صغيرة وشرطات. اتركه فارغاً ليُنشأ تلقائياً.'}
            />
            <Textarea label="وصف مختصر" name="short_description" defaultValue={course?.short_description ?? ''}
              error={err.short_description} className="min-h-20" hint="يظهر في بطاقة الدورة (300 حرف كحد أقصى)." />
            <Textarea label="وصف الدورة" name="description" defaultValue={course?.description ?? ''}
              error={err.description} className="min-h-40" />
          </section>

          <section className="space-y-5 rounded-card border border-line bg-white p-5 shadow-card sm:p-6">
            <h2 className="font-bold text-navy">محتوى البرنامج</h2>
            <Textarea label="الوحدات والدروس" name="program_content" defaultValue={programToText(course?.program_content)}
              className="min-h-48 font-medium"
              hint="السطر الأول عنوان الوحدة، والأسطر التالية دروسها. اترك سطراً فارغاً بين كل وحدة وأخرى." />
          </section>

          <section className="space-y-5 rounded-card border border-line bg-white p-5 shadow-card sm:p-6">
            <h2 className="font-bold text-navy">تحسين محركات البحث (SEO)</h2>
            <Input label="عنوان SEO" name="seo_title" defaultValue={course?.seo_title ?? ''} error={err.seo_title}
              hint="حتى 70 حرفاً. إن تُرك فارغاً يُستعمل اسم الدورة." />
            <Textarea label="وصف SEO" name="seo_description" defaultValue={course?.seo_description ?? ''}
              error={err.seo_description} className="min-h-20" hint="حتى 170 حرفاً." />
            <Input label="الكلمات المفتاحية" name="seo_keywords" defaultValue={course?.seo_keywords?.join('، ') ?? ''}
              hint="افصل بينها بفاصلة." />
          </section>
        </div>

        <div className="space-y-6">
          <section className="space-y-5 rounded-card border border-line bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-navy">تفاصيل الدورة</h2>
              {status && <Badge tone={tone[status]}>{statusLabels[status]}</Badge>}
            </div>
            <Select label="التصنيف" name="category_id" defaultValue={course?.category_id ?? ''}
              hint={categories.length === 0 ? 'لا توجد تصنيفات بعد.' : undefined}>
              <option value="">بدون تصنيف</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </Select>
            <Select label="المدرب" name="trainer_id" defaultValue={course?.trainer_id ?? ''}
              hint={trainers.length === 0 ? 'لا يوجد مدربون بعد.' : undefined}>
              <option value="">غير محدد</option>
              {trainers.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </Select>
            <Input label="المدة" name="duration_text" defaultValue={course?.duration_text ?? ''} error={err.duration_text} placeholder="مثال: 3 أشهر" />
            <Select label="المستوى" name="level" defaultValue={course?.level ?? 'all_levels'}>
              {Object.entries(levelLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
            <Select label="طريقة الدراسة" name="study_mode" defaultValue={course?.study_mode ?? 'onsite'}>
              {Object.entries(modeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
            <Input label="المكان" name="location" defaultValue={course?.location ?? ''} error={err.location} />
            <Select label="حالة التسجيل" name="registration" defaultValue={course?.registration ?? 'open'}>
              {Object.entries(registrationLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
            <Input label="السعر (دج)" name="price_dzd" type="number" inputMode="decimal" min={0} step="any" dir="ltr"
              defaultValue={course?.price_dzd ?? ''} error={err.price_dzd} />
            <Checkbox label="إظهار السعر للزوار" name="show_price" defaultChecked={course?.show_price} />
            <Checkbox label="تمنح شهادة" name="has_certificate" defaultChecked={course?.has_certificate} />
            <Input label="ملاحظة الشهادة" name="certificate_note" defaultValue={course?.certificate_note ?? ''} error={err.certificate_note} />
          </section>

        </div>
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-end gap-3 border-t border-line bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        {!isEdit && (
          <>
            <Button type="submit" name="intent" value="draft" variant="outline" loading={pending}>حفظ كمسودة</Button>
            {canPublish && <Button type="submit" name="intent" value="publish" variant="accent" loading={pending}>نشر</Button>}
          </>
        )}
        {isEdit && (
          <>
            {canPublish && status === 'published' && (
              <Button type="submit" name="intent" value="unpublish" variant="ghost" loading={pending}>إلغاء النشر</Button>
            )}
            {canPublish && status !== 'published' && (
              <Button type="submit" name="intent" value="publish" variant="accent" loading={pending}>نشر</Button>
            )}
            <Button type="submit" name="intent" value="save" loading={pending}>حفظ التعديلات</Button>
          </>
        )}
      </div>
    </form>
  );
}
