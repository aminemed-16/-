'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Check, Copy, Trash2 } from 'lucide-react';
import { ConfirmDeleteButton } from '@/components/admin/confirm-delete';
import { deleteMedia, updateAlt } from '@/app/admin/(dashboard)/media/actions';

type Item = { id: string; url: string; alt_text: string | null; mime_type: string; in_use: boolean };

export function MediaGrid({ items }: { items: Item[] }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copy(url: string, id: string) {
    try { await navigator.clipboard.writeText(url); setCopiedId(id); setTimeout(() => setCopiedId(null), 1500); }
    catch { /* clipboard unavailable: user can still select the URL manually */ }
  }

  if (items.length === 0) {
    return <div className="rounded-card border border-dashed border-line bg-white p-10 text-center text-ink/60">لا توجد صور بعد.</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((m) => (
        <div key={m.id} className="group overflow-hidden rounded-card border border-line bg-white shadow-card">
          <div className="relative aspect-square bg-mist">
            {m.mime_type === 'image/svg+xml'
              ? <img src={m.url} alt={m.alt_text ?? ''} className="h-full w-full object-contain p-4" />
              : <Image src={m.url} alt={m.alt_text ?? ''} fill sizes="200px" className="object-cover" />}
          </div>
          <div className="space-y-2 p-2.5">
            <input
              defaultValue={m.alt_text ?? ''}
              placeholder="نص بديل (alt)"
              onBlur={(e) => void updateAlt(m.id, e.target.value)}
              className="h-8 w-full rounded-md border border-line px-2 text-xs focus:border-royal focus:outline-none"
            />
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => copy(m.url, m.id)}
                className="inline-flex h-7 items-center gap-1 rounded-md border border-line px-2 text-[11px] text-navy hover:bg-mist">
                {copiedId === m.id ? <Check size={12} aria-hidden /> : <Copy size={12} aria-hidden />}
                {copiedId === m.id ? 'تم النسخ' : 'نسخ الرابط'}
              </button>
              {m.in_use ? (
                <span title="مستعملة في محتوى آخر، لا يمكن حذفها" className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[11px] text-ink/35">
                  <Trash2 size={12} aria-hidden /> مستعملة
                </span>
              ) : (
                <ConfirmDeleteButton action={deleteMedia} id={m.id} ariaLabel="حذف الصورة"
                  heading="حذف الصورة؟" confirmLabel="نعم، احذف" body="سيتم حذف الصورة نهائياً من المكتبة والتخزين." />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
