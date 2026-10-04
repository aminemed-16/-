import { cn } from '@/lib/cn';

/**
 * Temporary mark. Replace the inner block with the official logo (SVG/PNG) once the file is supplied;
 * the rest of the app only uses <Logo />, so nothing else changes.
 */
export function Logo({ light = false, className }: { light?: boolean; className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        aria-hidden
        className={cn(
          'grid h-10 w-10 place-items-center rounded-control text-lg font-bold tracking-tight',
          light ? 'bg-white text-navy' : 'bg-navy text-white',
        )}
      >
        LA
      </div>
      <div className="leading-tight">
        <div className={cn('text-base font-bold', light ? 'text-white' : 'text-navy')}>أكاديمية لينورين</div>
        <div className={cn('text-[11px] tracking-[0.18em]', light ? 'text-white/60' : 'text-ink/50')} dir="ltr">
          LINOURINE ACADEMY
        </div>
      </div>
    </div>
  );
}
