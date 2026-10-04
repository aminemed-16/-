import { forwardRef, useId, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const control =
  'w-full rounded-control border bg-white px-3.5 text-sm text-ink placeholder:text-ink/40 transition-colors focus:border-royal focus:outline-none focus:ring-2 focus:ring-royal/20';

function Wrap({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-ink">{label}</label>
      {children}
      {error ? <p id={`${id}-error`} className="text-xs text-red-600">{error}</p>
        : hint ? <p id={`${id}-hint`} className="text-xs text-ink/55">{hint}</p> : null}
    </div>
  );
}

type Common = { label: string; error?: string; hint?: string };

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & Common>(
  function Textarea({ label, error, hint, className, id, ...props }, ref) {
    const auto = useId(); const fid = id ?? auto;
    return (
      <Wrap id={fid} label={label} error={error} hint={hint}>
        <textarea ref={ref} id={fid} aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fid}-error` : hint ? `${fid}-hint` : undefined}
          className={cn(control, 'min-h-28 py-2.5 leading-7', error ? 'border-red-500' : 'border-line', className)} {...props} />
      </Wrap>
    );
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & Common>(
  function Select({ label, error, hint, className, id, children, ...props }, ref) {
    const auto = useId(); const fid = id ?? auto;
    return (
      <Wrap id={fid} label={label} error={error} hint={hint}>
        <select ref={ref} id={fid} aria-invalid={error ? true : undefined}
          className={cn(control, 'h-11', error ? 'border-red-500' : 'border-line', className)} {...props}>
          {children}
        </select>
      </Wrap>
    );
  },
);

export function Checkbox({ label, hint, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <input id={id} type="checkbox" className="mt-1 h-4 w-4 rounded border-line accent-navy" {...props} />
      <label htmlFor={id} className="text-sm text-ink">
        {label}
        {hint && <span className="block text-xs text-ink/55">{hint}</span>}
      </label>
    </div>
  );
}
