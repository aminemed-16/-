import { Navbar } from '@/components/public/navbar';
import { Footer } from '@/components/public/footer';
import { getPublicSettings } from '@/lib/settings';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await getPublicSettings();
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} />
    </div>
  );
}
