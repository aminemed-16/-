import { cn } from '@/lib/cn';

const tones = {
  neutral: 'bg-ink/8 text-ink/70',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  info: 'bg-royal/10 text-royal',
  accent: 'bg-magenta/10 text-magenta',
  danger: 'bg-red-50 text-red-700',
} as const;

export function Badge({ tone = 'neutral', children }: { tone?: keyof typeof tones; children: React.ReactNode }) {
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', tones[tone])}>{children}</span>;
}
