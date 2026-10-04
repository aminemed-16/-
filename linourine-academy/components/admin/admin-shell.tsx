'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Bell, LogOut, Menu, X } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { adminNav } from '@/lib/admin-nav';
import { cn } from '@/lib/cn';

type Props = {
  user: { fullName: string; email: string; roleLabel: string };
  permissions: string[];
  isSuperAdmin: boolean;
  unreadCount: number;
  signOutAction: () => Promise<void>;
  children: React.ReactNode;
};

export function AdminShell({ user, permissions, isSuperAdmin, unreadCount, signOutAction, children }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const allowed = (permission?: string) => !permission || isSuperAdmin || permissions.includes(permission);
  const isActive = (href: string) => (href === '/admin' ? pathname === href : pathname.startsWith(href));

  return (
    <div className="min-h-screen">
      {open && <div className="fixed inset-0 z-30 bg-navy/50 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}

      <aside
        id="admin-sidebar"
        className={cn(
          'fixed inset-y-0 start-0 z-40 flex w-72 flex-col bg-navy text-white transition-transform duration-200',
          open ? 'translate-x-0' : 'rtl:translate-x-full ltr:-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-5">
          <Logo light />
          <button onClick={() => setOpen(false)} className="rounded-md p-1.5 text-white/70 hover:bg-white/10 lg:hidden" aria-label="إغلاق القائمة">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="القائمة الرئيسية">
          {adminNav.map((group) => {
            const items = group.items.filter((i) => allowed(i.permission));
            if (items.length === 0) return null;
            return (
              <div key={group.title}>
                <p className="mb-1.5 px-3 text-xs font-medium text-white/45">{group.title}</p>
                <ul className="space-y-0.5">
                  {items.map(({ label, href, icon: Icon, ready }) => {
                    const active = ready && isActive(href);
                    const base = 'relative flex items-center gap-3 rounded-control px-3 py-2.5 text-sm';
                    return (
                      <li key={href}>
                        {ready ? (
                          <Link
                            href={href}
                            aria-current={active ? 'page' : undefined}
                            className={cn(base, 'transition-colors', active ? 'bg-white/12 font-semibold' : 'text-white/80 hover:bg-white/8 hover:text-white')}
                          >
                            {active && <span aria-hidden className="absolute inset-y-2 start-0 w-[3px] rounded-full bg-magenta" />}
                            <Icon size={18} aria-hidden />
                            {label}
                          </Link>
                        ) : (
                          <span aria-disabled className={cn(base, 'cursor-not-allowed text-white/35')}>
                            <Icon size={18} aria-hidden />
                            <span className="flex-1">{label}</span>
                            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px]">قريباً</span>
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
      </aside>

      <div className="lg:ps-72">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur sm:px-6">
          <button
            onClick={() => setOpen(true)}
            className="rounded-md p-2 text-navy hover:bg-navy/5 lg:hidden"
            aria-label="فتح القائمة"
            aria-controls="admin-sidebar"
            aria-expanded={open}
          >
            <Menu size={22} />
          </button>

          <div className="flex-1" />

          <Link
            href="/admin/registrations"
            className="relative rounded-md p-2 text-navy hover:bg-navy/5"
            aria-label={unreadCount > 0 ? `${unreadCount} إشعارات جديدة` : 'لا توجد إشعارات جديدة'}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -end-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-magenta px-1 text-[10px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>

          <div className="hidden text-end leading-tight sm:block">
            <p className="text-sm font-semibold text-navy">{user.fullName}</p>
            <p className="text-xs text-ink/55">{user.roleLabel}</p>
          </div>

          <form action={signOutAction}>
            <button type="submit" className="flex items-center gap-2 rounded-control border border-line px-3 py-2 text-sm text-navy hover:bg-mist">
              <LogOut size={16} aria-hidden />
              <span className="hidden sm:inline">تسجيل الخروج</span>
              <span className="sr-only sm:hidden">تسجيل الخروج</span>
            </button>
          </form>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
