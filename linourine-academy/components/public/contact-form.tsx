'use client';

import { useId, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/field';
import { Button } from '@/components/ui/button';

type Status = 'idle' | 'loading' | 'success' | 'error';

export function ContactForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const honeypotId = useId();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    setFieldErrors({});
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(fd)),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setFieldErrors(data.fieldErrors ?? {});
        setMessage(data.error ?? 'تعذر إرسال الرسالة.');
        setStatus('error');
        return;
      }
      setStatus('success');
      e.currentTarget.reset();
    } catch {
      setMessage('تعذر الاتصال بالخادم. حاول مرة أخرى.');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div role="status" className="rounded-card border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="font-bold text-emerald-800">تم إرسال رسالتك</p>
        <p className="mt-1 text-sm text-emerald-700">سنعاود الاتصال بك في أقرب وقت.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor={honeypotId}>الموقع الإلكتروني</label>
        <input id={honeypotId} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <Input label="الاسم" name="name" required maxLength={100} error={fieldErrors.name} />
      <Input label="الهاتف (اختياري)" name="phone" type="tel" dir="ltr" error={fieldErrors.phone} />
      <Input label="البريد الإلكتروني (اختياري)" name="email" type="email" dir="ltr" error={fieldErrors.email} />
      <Input label="الموضوع (اختياري)" name="subject" maxLength={150} error={fieldErrors.subject} />
      <Textarea label="الرسالة" name="message" required maxLength={2000} className="min-h-32" error={fieldErrors.message} />
      {status === 'error' && <p role="alert" className="rounded-control bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{message}</p>}
      <Button type="submit" size="lg" loading={status === 'loading'} className="w-full">إرسال الرسالة</Button>
    </form>
  );
}
