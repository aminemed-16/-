import { Facebook, Globe, Instagram, Send, Youtube } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const icons: Record<string, LucideIcon> = {
  facebook: Facebook, instagram: Instagram, youtube: Youtube, telegram: Send,
  website: Globe, whatsapp: Globe, tiktok: Globe, x: Globe, linkedin: Globe,
};
const labels: Record<string, string> = {
  facebook: 'فيسبوك', instagram: 'إنستغرام', tiktok: 'تيك توك', youtube: 'يوتيوب',
  whatsapp: 'واتساب', telegram: 'تيليغرام', website: 'الموقع', x: 'إكس', linkedin: 'لينكدإن',
};

export function SocialIcon({ platform, url, light }: { platform: string; url: string; light?: boolean }) {
  const Icon = icons[platform] ?? Globe;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" aria-label={labels[platform] ?? platform}
      className={light
        ? 'grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20'
        : 'grid h-9 w-9 place-items-center rounded-full bg-navy/5 text-navy transition-colors hover:bg-navy/10'}>
      <Icon size={17} aria-hidden />
    </a>
  );
}
