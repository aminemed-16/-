import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'غير مصرح' };

export default function ForbiddenPage() {
  return (
    <div className="mx-auto max-w-md rounded-card border border-line bg-white p-8 text-center shadow-card">
      <h1 className="text-xl font-bold text-navy">لا تملك صلاحية لهذه الصفحة</h1>
      <p className="mt-2 text-sm text-ink/65">إذا كنت تحتاج إليها، اطلب من المدير العام إضافة الصلاحية لحسابك.</p>
      <Link href="/admin" className="mt-6 inline-flex h-11 items-center rounded-control bg-navy px-5 text-sm font-semibold text-white hover:bg-navy/90">
        العودة إلى لوحة التحكم
      </Link>
    </div>
  );
}
