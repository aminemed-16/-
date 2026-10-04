import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { requirePermission } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAudit } from '@/lib/audit';
import { ALLOWED_MIME, MAX_FILE_BYTES, safeFileExt, sanitizeSvg } from '@/lib/validation/media';

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'media';

export async function POST(req: Request) {
  const ctx = await requirePermission('manage_media');

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!form || !(file instanceof File)) return NextResponse.json({ ok: false, error: 'لم يتم اختيار ملف.' }, { status: 400 });
  if (!ALLOWED_MIME.includes(file.type as (typeof ALLOWED_MIME)[number])) {
    return NextResponse.json({ ok: false, error: 'نوع الملف غير مدعوم. يُسمح فقط بـ JPG وPNG وWEBP وSVG.' }, { status: 415 });
  }
  if (file.size === 0 || file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ ok: false, error: 'حجم الملف يجب ألا يتجاوز 5 ميغابايت.' }, { status: 413 });
  }

  const altText = String(form.get('altText') ?? '').trim().slice(0, 200);
  const ext = safeFileExt(file.type);
  const path = `${new Date().toISOString().slice(0, 7)}/${randomUUID()}.${ext}`;

  let bytes = new Uint8Array(await file.arrayBuffer());
  if (file.type === 'image/svg+xml') {
    bytes = new TextEncoder().encode(sanitizeSvg(new TextDecoder().decode(bytes)));
  }

  const db = createAdminClient();
  const upload = await db.storage.from(BUCKET).upload(path, bytes, { contentType: file.type, upsert: false });
  if (upload.error) {
    console.error('media upload failed', upload.error);
    return NextResponse.json({ ok: false, error: 'تعذر رفع الملف. حاول مرة أخرى.' }, { status: 500 });
  }

  const { data: pub } = db.storage.from(BUCKET).getPublicUrl(path);
  const { data: row, error } = await db.from('media').insert({
    storage_path: path, url: pub.publicUrl, alt_text: altText || null, mime_type: file.type,
    size_bytes: bytes.byteLength, uploaded_by: ctx.id,
  }).select('id, url, alt_text, mime_type, size_bytes, created_at').single();

  if (error || !row) {
    await db.storage.from(BUCKET).remove([path]); // don't leave an orphaned file behind
    console.error('media row insert failed', error);
    return NextResponse.json({ ok: false, error: 'تعذر حفظ الصورة.' }, { status: 500 });
  }

  await logAudit({ actorId: ctx.id, actorLabel: ctx.email, action: 'create', entityType: 'media', entityId: row.id, entityLabel: file.name });
  return NextResponse.json({ ok: true, media: row });
}
