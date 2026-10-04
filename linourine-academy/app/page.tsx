import { Logo } from '@/components/brand/logo';

// Placeholder: the public website is built in a later phase.
export default function HomePage() {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div className="space-y-4">
        <Logo className="justify-center" />
        <p className="text-ink/70">الموقع قيد الإنشاء.</p>
      </div>
    </main>
  );
}
