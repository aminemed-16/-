import Link from 'next/link';
import { Logo } from '@/components/brand/logo';

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div className="max-w-md space-y-5">
        <Logo className="justify-center" />
        <h1 className="text-2xl font-bold text-navy">لم نعثر على هذه الصفحة</h1>
        <p className="text-ink/70">قد يكون الرابط قديماً أو مكتوباً بشكل غير صحيح.</p>
        <Link href="/" className="inline-flex h-11 items-center rounded-control bg-navy px-5 text-sm font-semibold text-white hover:bg-navy/90">
          العودة إلى الرئيسية
        </Link>
      </div>
    </main>
  );
}
