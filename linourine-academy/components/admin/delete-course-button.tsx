'use client';

import { useRef } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteCourse } from '@/app/admin/(dashboard)/courses/actions';

export function DeleteCourseButton({ id, title }: { id: string; title: string }) {
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => dialog.current?.showModal()}
        className="text-red-600 hover:bg-red-50" aria-label={`حذف الدورة ${title}`}>
        <Trash2 size={16} aria-hidden /> حذف
      </Button>

      <dialog ref={dialog} className="w-[min(92vw,26rem)] rounded-card p-0 text-ink shadow-xl backdrop:bg-navy/50">
        <form action={deleteCourse} className="space-y-4 p-6">
          <input type="hidden" name="id" value={id} />
          <h2 className="text-lg font-bold text-navy">حذف الدورة؟</h2>
          <p className="text-sm leading-6 text-ink/70">
            سيتم حذف «{title}» نهائياً مع صفحتها. طلبات التسجيل المرتبطة بها ستبقى محفوظة باسم الدورة.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => dialog.current?.close()}>إلغاء</Button>
            <Button type="submit" className="bg-red-600 hover:bg-red-700">نعم، احذف الدورة</Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
