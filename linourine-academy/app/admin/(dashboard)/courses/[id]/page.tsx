import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { CourseForm, type CourseRow } from '@/components/admin/course-form';
import { Notice, PageHeader } from '@/components/admin/page-header';
import { can, requirePermission } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { updateCourse } from '../actions';
import { getCourseFormOptions } from '../options';

export const metadata: Metadata = { title: 'تعديل الدورة' };

export default async function EditCoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const ctx = await requirePermission('edit_courses');
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();

  const supabase = await createClient();
  const { data } = await supabase.from('courses').select('*, media:cover_media_id(url)').eq('id', id).maybeSingle();
  if (!data) notFound();

  const [{ categories, trainers }, { saved }] = await Promise.all([getCourseFormOptions(), searchParams]);
  const course = data as unknown as CourseRow;

  return (
    <>
      <PageHeader
        title={course.title}
        actions={<Link href="/admin/courses" className="text-sm text-navy hover:underline">العودة إلى الدورات</Link>}
      />
      {saved && <Notice>تم الحفظ.</Notice>}
      <CourseForm
        key={`${course.id}:${course.status}`}
        course={course}
        categories={categories}
        trainers={trainers}
        media={media}
        canPublish={can(ctx, 'publish_courses')}
        action={updateCourse.bind(null, id)}
      />
    </>
  );
}
