import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getClientIp, hashValue } from '@/lib/hash';
import { rateLimit } from '@/lib/rate-limit';
import { contactSchema } from '@/lib/validation/contact';

const fail = (status: number, error: string, fieldErrors?: Record<string, string>) =>
  NextResponse.json({ ok: false, error, fieldErrors }, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  if (origin) {
    try { if (new URL(origin).host !== req.headers.get('host')) return fail(403, 'طلب غير مسموح.'); }
    catch { return fail(403, 'طلب غير مسموح.'); }
  }

  let body: unknown;
  try { body = await req.json(); } catch { return fail(400, 'بيانات غير صالحة.'); }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return fail(422, 'راجع الحقول المحددة.', fieldErrors);
  }
  if (parsed.data.website) return NextResponse.json({ ok: true }); // honeypot

  const ipHash = hashValue(await getClientIp());
  const { ok } = await rateLimit(`contact:ip:${ipHash}`, 5, 3600);
  if (!ok) return fail(429, 'طلبات كثيرة. حاول لاحقاً.');

  const { error } = await createAdminClient().from('contact_messages').insert({
    name: parsed.data.name, phone: parsed.data.phone ?? null, email: parsed.data.email ?? null,
    subject: parsed.data.subject || null, message: parsed.data.message, ip_hash: ipHash,
  });
  if (error) { console.error('contact insert failed', error); return fail(500, 'تعذر إرسال الرسالة. حاول مرة أخرى.'); }

  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
