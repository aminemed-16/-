'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { signIn, type LoginState } from './actions';

export function LoginForm({ next, initialError }: { next?: string; initialError?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, { error: initialError });

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={next ?? ''} />
      <Input label="البريد الإلكتروني" name="email" type="email" autoComplete="username" dir="ltr" required />
      <Input label="كلمة السر" name="password" type="password" autoComplete="current-password" dir="ltr" required />
      {state.error && (
        <p role="alert" className="rounded-control bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" loading={pending} className="w-full">
        تسجيل الدخول
      </Button>
    </form>
  );
}
