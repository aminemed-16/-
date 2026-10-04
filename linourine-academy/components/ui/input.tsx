import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string };

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, className, id, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'h-11 w-full rounded-control border bg-white px-3.5 text-sm text-ink placeholder:text-ink/40',
          'transition-colors focus:border-royal focus:outline-none focus:ring-2 focus:ring-royal/20',
          error ? 'border-red-500' : 'border-line',
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-xs text-ink/55">{hint}</p>
      ) : null}
    </div>
  );
});
