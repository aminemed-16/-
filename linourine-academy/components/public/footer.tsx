import Link from 'next/link';
import { MapPin, Phone } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { SocialIcon } from './social-icon';
import type { PublicSettings } from '@/lib/settings';

const columns = [
  { title: 'روابط سريعة', links: [{ href: '/about', label: 'من نحن' }, { href: '/courses', label: 'الدورات' }, { href: '/services', label: 'الخدمات' }, { href: '/contact', label: 'تواصل معنا' }] },
];

export function Footer({ settings }: { settings: PublicSettings }) {
  const { contact, footer, social } = settings;
  return (
    <footer className="border-t border-line bg-navy text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1.2fr]">
        <div className="space-y-4">
          <Logo light />
          {footer.about && <p className="max-w-sm text-sm leading-7 text-white/70">{footer.about}</p>}
          {social.length > 0 && (
            <div className="flex gap-2 pt-1">
              {social.map((s) => <SocialIcon key={s.platform} platform={s.platform} url={s.url} light />)}
            </div>
          )}
        </div>

        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="mb-4 text-sm font-semibold text-white/50">{col.title}</h2>
            <ul className="space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href}><Link href={l.href} className="text-sm text-white/80 hover:text-white">{l.label}</Link></li>
              ))}
            </ul>
          </nav>
        ))}

        <div>
          <h2 className="mb-4 text-sm font-semibold text-white/50">تواصل معنا</h2>
          <ul className="space-y-3 text-sm text-white/80">
            {contact.phone && (
              <li className="flex items-start gap-2.5">
                <Phone size={16} aria-hidden className="mt-0.5 shrink-0 text-white/50" />
                <a href={`tel:${contact.phone.replace(/\s/g, '')}`} dir="ltr" className="hover:text-white">{contact.phone}</a>
              </li>
            )}
            {contact.address && (
              <li className="flex items-start gap-2.5">
                <MapPin size={16} aria-hidden className="mt-0.5 shrink-0 text-white/50" />
                <span>{contact.address}</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-white/50 sm:px-6">
        {footer.copyright}
      </div>
    </footer>
  );
}
