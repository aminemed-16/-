'use client';

import { useTransition } from 'react';
import { Mail, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ConfirmDeleteButton } from '@/components/admin/confirm-delete';
import { cn } from '@/lib/cn';
import { deleteMessage, markMessageRead } from '@/app/admin/(dashboard)/messages/actions';

type Props = {
  msg: { id: string; name: string; phone: string | null; email: string | null; subject: string | null; message: string; is_read: boolean; created_at: string };
  dateLabel: string;
  canManage: boolean;
};

export function MessageRow({ msg, dateLabel, canManage }: Props) {
  const [pending, start] = useTransition();

  return (
    <li className={cn('space-y-2 p-4 sm:p-5', !msg.is_read && 'bg-blush/40')}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className={cn('text-navy', !msg.is_read ? 'font-bold' : 'font-semibold')}>{msg.name}</span>
            {!msg.is_read && <Badge tone="accent">جديدة</Badge>}
          </div>
          <p className="text-xs text-ink/55">{[msg.subject, dateLabel].filter(Boolean).join(' • ')}</p>
        </div>
        <div className="flex gap-2">
          {msg.phone && <a href={`tel:${msg.phone}`} className="inline-flex h-8 items-center gap-1.5 rounded-control border border-line px-2.5 text-xs text-navy hover:bg-mist"><Phone size={13} aria-hidden /> اتصال</a>}
          {msg.email && <a href={`mailto:${msg.email}`} className="inline-flex h-8 items-center gap-1.5 rounded-control border border-line px-2.5 text-xs text-navy hover:bg-mist"><Mail size={13} aria-hidden /> بريد</a>}
        </div>
      </div>
      <p className="whitespace-pre-line text-sm leading-6 text-ink/75">{msg.message}</p>
      {canManage && (
        <div className="flex justify-end gap-2 pt-1">
          <button disabled={pending} onClick={() => start(() => markMessageRead(msg.id, !msg.is_read))}
            className="rounded-control border border-line px-3 py-1.5 text-xs text-navy hover:bg-mist disabled:opacity-50">
            {msg.is_read ? 'وضع كغير مقروءة' : 'وضع كمقروءة'}
          </button>
          <ConfirmDeleteButton action={deleteMessage} id={msg.id} ariaLabel={`حذف رسالة ${msg.name}`}
            heading="حذف الرسالة؟" confirmLabel="نعم، احذف" body={`سيتم حذف رسالة «${msg.name}» نهائياً.`} />
        </div>
      )}
    </li>
  );
}
