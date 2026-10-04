import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans_Arabic } from 'next/font/google';
import './globals.css';

const sans = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: { default: 'أكاديمية لينورين', template: '%s | أكاديمية لينورين' },
  description: 'أكاديمية لينورين: تعليم متميز، دورات تكوينية، لغات، وورشات فنية في غليزان.',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#1B2A6B' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={sans.variable}>
      <body>{children}</body>
    </html>
  );
}
