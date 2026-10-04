'use client';

import { useId, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, Textarea } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { wilayas } from '@/lib/wilayas';

type Props = { courseId?: string; courseTitle?: string; defaultWilaya: string };
type Status = 'idle' | 'loading' | 'success' | 'error';

export function RegistrationForm({ courseId, courseTitle, defaultWilaya }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const honeypotId = useId();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    setFieldErrors({});

    const fd = new FormData(e.currentTarget);
    const payload = {
      full_name: fd.get('full_name'),
      phone: fd.get('phone'),
      email: fd.get('email'),
      wilaya: fd.get('wilaya'),
      commune: fd.get('commune'),
      notes: fd.get('notes'),
      course_id: courseId ?? null,
      website: fd.get('website'), // honeypot
    };

    try {
      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setFieldErrors(data.fieldErrors ?? {});
        setMessage(data.error ?? 'تعذر إرسال الطلب. حاول مرة أخرى.');
        setStatus('error');
        return;
      }
      setStatus('success');
      e.currentTarget.reset();
    } catch {
      setMessage('تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div role="status" className="rounded-card border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="font-bold text-emerald-800">تم استلام طلبك بنجاح</p>
        <p className="mt-1 text-sm text-emerald-700">سيتواصل معك فريقنا قريباً لإتمام التسجيل.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {courseTitle && <p className="text-sm text-ink/60">الدورة: <span className="font-semibold text-navy">{courseTitle}</span></p>}

      {/* Honeypot: hidden from sighted users, invisible to screen readers, but bots fill it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor={honeypotId}>الموقع الإلكتروني</label>
        <input id={honeypotId} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <Input label="الاسم واللقب" name="full_name" required maxLength={100} error={fieldErrors.full_name} />
      <Input label="رقم الهاتف" name="phone" type="tel" dir="ltr" required placeholder="0551 23 45 67" error={fieldErrors.phone} />
      <Input label="البريد الإلكتروني (اختياري)" name="email" type="email" dir="ltr" error={fieldErrors.email} />
      <Select label="الولاية" name="wilaya" defaultValue={defaultWilaya} required error={fieldErrors.wilaya}>
        {wilayas.map((w) => <option key={w} value={w}>{w}</option>)}
      </Select>
      <Input label="البلدية (اختياري)" name="commune" maxLength={80} error={fieldErrors.commune} />
      <Textarea label="ملاحظات (اختياري)" name="notes" maxLength={1000} className="min-h-24" error={fieldErrors.notes} />

      {status === 'error' && <p role="alert" className="rounded-control bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{message}</p>}

      <Button type="submit" size="lg" loading={status === 'loading'} className="w-full">إرسال طلب التسجيل</Button>
      <p className="text-center text-xs text-ink/45">لا يتم إنشاء حساب لك؛ سيتصل بك فريقنا لإتمام التسجيل.</p>
    </form>
  );
}
