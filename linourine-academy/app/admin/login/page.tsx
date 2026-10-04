import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Logo } from '@/components/brand/logo';
import { getStaffContext } from '@/lib/auth/session';
import { safeAdminPath } from '@/lib/validation/auth';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'تسجيل الدخول', robots: { index: false, follow: false } };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  if (await getStaffContext()) redirect(safeAdminPath(next));

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-navy p-12 text-white lg:flex">
        <Logo light />
        <div className="relative z-10 max-w-md space-y-3">
          <h1 className="text-3xl font-bold leading-snug">لوحة إدارة الأكاديمية</h1>
          <p className="text-white/70">أدِر الدورات وطلبات التسجيل ومحتوى الموقع من مكان واحد.</p>
        </div>
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -start-24 h-80 w-80 rounded-full bg-magenta/25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -top-24 -end-16 h-72 w-72 rounded-full bg-royal/40 blur-3xl" />
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          <Logo className="lg:hidden" />
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold text-navy">تسجيل الدخول</h2>
            <p className="text-sm text-ink/60">للمسؤولين والعاملين في الأكاديمية فقط.</p>
          </div>
          <LoginForm
            next={next}
            initialError={error === 'no-access' ? 'هذا الحساب لا يملك صلاحية الدخول إلى لوحة الإدارة.' : undefined}
          />
        </div>
      </section>
    </main>
  );
}
