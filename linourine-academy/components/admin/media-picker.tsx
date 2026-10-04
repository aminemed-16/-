'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ImagePlus, X } from 'lucide-react';

type Item = { id: string; url: string; alt_text: string | null; mime_type: string };

/** Lightweight picker backed by a hidden input, so it drops into a normal <form action={...}> unchanged. */
export function MediaPicker({ name, items, initialId, initialUrl, label }: { name: string; items: Item[]; initialId?: string | null; initialUrl?: string | null; label: string }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<{ id: string; url: string } | null>(initialId && initialUrl ? { id: initialId, url: initialUrl } : null);

  return (
    <div className="space-y-1.5">
      <span className="block text-sm font-medium text-ink">{label}</span>
      <input type="hidden" name={name} value={selected?.id ?? ''} />

      {selected ? (
        <div className="relative inline-block">
          <div className="h-28 w-28 overflow-hidden rounded-control border border-line bg-mist">
            <Image src={selected.url} alt="" width={112} height={112} className="h-full w-full object-cover" />
          </div>
          <button type="button" onClick={() => setSelected(null)} aria-label="إزالة الصورة"
            className="absolute -start-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-white text-ink shadow ring-1 ring-line hover:bg-red-50 hover:text-red-600">
            <X size={14} aria-hidden />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(true)}
          className="flex h-28 w-28 flex-col items-center justify-center gap-1 rounded-control border-2 border-dashed border-line text-ink/50 hover:border-royal hover:text-royal">
          <ImagePlus size={22} aria-hidden /><span className="text-xs">اختر صورة</span>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-navy/50 p-4" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-card bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-navy">اختر صورة من المكتبة</h2>
              <button onClick={() => setOpen(false)} aria-label="إغلاق" className="rounded-md p-1.5 hover:bg-mist"><X size={18} /></button>
            </div>
            {items.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink/55">لا توجد صور بعد. ارفع صوراً من صفحة «الصور والملفات» أولاً.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {items.map((it) => (
                  <button key={it.id} type="button" onClick={() => { setSelected({ id: it.id, url: it.url }); setOpen(false); }}
                    className="aspect-square overflow-hidden rounded-control border border-line bg-mist hover:ring-2 hover:ring-royal">
                    {it.mime_type === 'image/svg+xml'
                      ? <img src={it.url} alt={it.alt_text ?? ''} className="h-full w-full object-contain p-2" />
                      : <Image src={it.url} alt={it.alt_text ?? ''} width={150} height={150} className="h-full w-full object-cover" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
