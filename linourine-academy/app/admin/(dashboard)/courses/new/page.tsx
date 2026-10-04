import type { Metadata } from 'next';
import Link from 'next/link';
import { CourseForm } from '@/components/admin/course-form';
import { PageHeader } from '@/components/admin/page-header';
import { can, requirePermission } from '@/lib/auth/session';
import { createCourse } from '../actions';
import { getCourseFormOptions } from '../options';

export const metadata: Metadata = { title: 'إضافة دورة' };

export default async function NewCoursePage() {
  const ctx = await requirePermission('create_courses');
  const { categories, trainers, media } = await getCourseFormOptions();

  return (
    <>
      <PageHeader
        title="إضافة دورة"
        description="احفظها كمسودة أولاً، وانشرها عندما تكون جاهزة."
        actions={<Link href="/admin/courses" className="text-sm text-navy hover:underline">العودة إلى الدورات</Link>}
      />
      <CourseForm categories={categories} trainers={trainers} media={media} canPublish={can(ctx, 'publish_courses')} action={createCourse} />
    </>
  );
}
