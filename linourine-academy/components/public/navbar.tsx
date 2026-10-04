'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { cn } from '@/lib/cn';

const links = [
  { href: '/', label: 'الرئيسية' },
  { href: '/about', label: 'من نحن' },
  { href: '/courses', label: 'الدورات' },
  { href: '/services', label: 'الخدمات' },
  { href: '/contact', label: 'تواصل معنا' },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" aria-label="أكاديمية لينورين — الرئيسية"><Logo /></Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="القائمة الرئيسية">
          {links.map((l) => {
            const active = l.href === '/' ? pathname === l.href : pathname.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href} aria-current={active ? 'page' : undefined}
                className={cn('rounded-control px-3.5 py-2 text-sm font-medium transition-colors',
                  active ? 'text-navy' : 'text-ink/65 hover:text-navy')}>
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/courses" className="hidden h-11 items-center rounded-control bg-magenta px-5 text-sm font-semibold text-white transition-colors hover:bg-magenta/90 sm:inline-flex">
            اكتشف دوراتنا
          </Link>
          <button onClick={() => setOpen(true)} aria-label="فتح القائمة" aria-expanded={open} aria-controls="mobile-menu"
            className="rounded-md p-2 text-navy hover:bg-navy/5 lg:hidden">
            <Menu size={24} />
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-navy/50 lg:hidden" onClick={() => setOpen(false)} aria-hidden>
          <div id="mobile-menu" onClick={(e) => e.stopPropagation()}
            className="absolute inset-y-0 end-0 flex w-[82%] max-w-xs flex-col bg-white p-5 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <Logo />
              <button onClick={() => setOpen(false)} aria-label="إغلاق القائمة" className="rounded-md p-1.5 text-navy hover:bg-navy/5">
                <X size={22} />
              </button>
            </div>
            <nav className="flex flex-col gap-1" aria-label="القائمة الرئيسية">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="rounded-control px-3 py-3 text-base font-medium text-ink hover:bg-mist">
                  {l.label}
                </Link>
              ))}
            </nav>
            <Link href="/courses" className="mt-6 inline-flex h-12 items-center justify-center rounded-control bg-magenta text-sm font-semibold text-white">
              اكتشف دوراتنا
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
