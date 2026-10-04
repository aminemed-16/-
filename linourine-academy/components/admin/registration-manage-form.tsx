'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, Textarea } from '@/components/ui/field';
import { requestStatusLabels } from '@/lib/labels';
import type { RegistrationFormState } from '@/lib/validation/registration';

type Props = {
  status: keyof typeof requestStatusLabels;
  notes: string;
  action: (prev: RegistrationFormState, fd: FormData) => Promise<RegistrationFormState>;
};

export function RegistrationManageForm({ status, notes, action }: Props) {
  const [state, formAction, pending] = useActionState<RegistrationFormState, FormData>(action, {});
  const err = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <Select label="حالة الطلب" name="status" defaultValue={status}>
        {Object.entries(requestStatusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </Select>
      <Textarea label="ملاحظات داخلية" name="internal_notes" defaultValue={notes} error={err.internal_notes}
        hint="لا يراها المتقدم. مثال: اتصلت به وطلب التأجيل إلى الشهر القادم." />
      {state.error && <p role="alert" className="rounded-control bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{state.error}</p>}
      {state.ok && <p role="status" className="rounded-control bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">تم الحفظ.</p>}
      <Button type="submit" loading={pending} className="w-full">حفظ</Button>
    </form>
  );
}
