'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud } from 'lucide-react';
import { cn } from '@/lib/cn';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/svg+xml';

export function MediaUploader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append('file', file);
      try {
        const res = await fetch('/api/admin/media', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok || !data.ok) setError(data.error ?? 'تعذر رفع الملف.');
      } catch {
        setError('تعذر الاتصال بالخادم.');
      }
    }
    setBusy(false);
    router.refresh();
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); void upload(e.dataTransfer.files); }}
      className={cn(
        'rounded-card border-2 border-dashed p-8 text-center transition-colors',
        dragging ? 'border-royal bg-royal/5' : 'border-line bg-white',
      )}
    >
      <UploadCloud size={28} aria-hidden className="mx-auto mb-2 text-ink/40" />
      <p className="text-sm text-ink/65">اسحب الصور هنا أو</p>
      <button type="button" disabled={busy} onClick={() => inputRef.current?.click()}
        className="mt-2 inline-flex h-10 items-center rounded-control bg-navy px-4 text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-60">
        {busy ? 'جارٍ الرفع…' : 'اختر ملفات'}
      </button>
      <input ref={inputRef} type="file" accept={ACCEPT} multiple hidden onChange={(e) => void upload(e.target.files)} />
      <p className="mt-2 text-xs text-ink/45">JPG، PNG، WEBP أو SVG — بحد أقصى 5 ميغابايت لكل ملف.</p>
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
