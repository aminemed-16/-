import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(128),
});

/** Only allow redirects back inside the admin area (prevents open redirects). */
export function safeAdminPath(value: unknown) {
  if (typeof value !== 'string') return '/admin';
  return value.startsWith('/admin') && !value.startsWith('//') && !value.includes('\\') ? value : '/admin';
}
