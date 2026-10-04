import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getClientIp, hashValue } from '@/lib/hash';
import { rateLimit } from '@/lib/rate-limit';
import { publicRegistrationSchema } from '@/lib/validation/registration';

const fail = (status: number, error: string, fieldErrors?: Record<string, string>) =>
  NextResponse.json({ ok: false, error, fieldErrors }, { status, headers: { 'Cache-Control': 'no-store' } });

/**
 * Public registration request. Visitors never write to the database directly:
 * same-origin check -> validation -> honeypot -> rate limits -> insert with the service role.
 */
export async function POST(req: Request) {
  // CSRF: browsers always send Origin on cross-site POSTs.
  const origin = req.headers.get('origin');
  if (origin) {
    try {
      if (new URL(origin).host !== req.headers.get('host')) return fail(403, 'طلب غير مسموح.');
    } catch {
      return fail(403, 'طلب غير مسموح.');
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail(400, 'بيانات غير صالحة.');
  }

  const parsed = publicRegistrationSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return fail(422, 'راجع الحقول المحددة.', fieldErrors);
  }
  const d = parsed.data;

  // Bots fill the hidden field: pretend success, store nothing.
  if (d.website) return NextResponse.json({ ok: true });

  const ipHash = hashValue(await getClientIp());
  const [byIp, byPhone] = await Promise.all([
    rateLimit(`reg:ip:${ipHash}`, 5, 3600),
    rateLimit(`reg:phone:${hashValue(d.phone)}`, 3, 86400),
  ]);
  if (!byIp.ok || !byPhone.ok) return fail(429, 'طلبات كثيرة. حاول لاحقاً أو اتصل بنا مباشرة.');

  const db = createAdminClient();

  if (d.course_id) {
    const { data: course } = await db.from('courses').select('status, registration').eq('id', d.course_id).maybeSingle();
    if (!course || course.status !== 'published') return fail(404, 'هذه الدورة غير متاحة.');
    if (course.registration !== 'open') return fail(409, 'التسجيل في هذه الدورة غير مفتوح حالياً.');

    // Same phone + same course within 24h: treat as already received (idempotent, no duplicates).
    const since = new Date(Date.now() - 86400_000).toISOString();
    const { count } = await db.from('registration_requests').select('id', { count: 'exact', head: true })
      .eq('course_id', d.course_id).eq('phone', d.phone).gte('created_at', since);
    if (count) return NextResponse.json({ ok: true });
  }

  const { error } = await db.from('registration_requests').insert({
    course_id: d.course_id ?? null,
    full_name: d.full_name,
    phone: d.phone,
    email: d.email ?? null,
    wilaya: d.wilaya,
    commune: d.commune || null,
    notes: d.notes || null,
    ip_hash: ipHash,
  });
  if (error) {
    console.error('registration insert failed', error);
    return fail(500, 'تعذر إرسال الطلب. حاول مرة أخرى.');
  }

  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
