'use server';

import { requirePermission } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';
import { settingsSchema, type SettingsFormState } from '@/lib/validation/settings';

const socialPlatforms = ['facebook', 'instagram', 'tiktok', 'youtube'] as const;

export async function updateSettings(_prev: SettingsFormState, fd: FormData): Promise<SettingsFormState> {
  const ctx = await requirePermission('manage_settings');

  const raw = Object.fromEntries(
    Object.keys(settingsSchema.shape).map((k) => [k, String(fd.get(k) ?? '')]),
  );
  const parsed = settingsSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { error: 'راجع الحقول المحددة.', fieldErrors };
  }

  const supabase = await createClient();
  const d = parsed.data;
  const rows = Object.entries(d)
    .filter(([k]) => !k.startsWith('social.'))
    .map(([key, value]) => ({ key, value, updated_by: ctx.id }));

  const { error } = await supabase.from('settings').upsert(rows, { onConflict: 'key' });
  if (error) { console.error('settings upsert failed', error); return { error: 'تعذر حفظ الإعدادات. حاول مرة أخرى.' }; }

  // Social links live in their own table; keep the four well-known platforms in sync.
  for (const platform of socialPlatforms) {
    const value = d[`social.${platform}` as const];
    if (value) {
      await supabase.from('social_links').upsert({ platform, url: value, is_visible: true }, { onConflict: 'platform' });
    } else {
      await supabase.from('social_links').delete().eq('platform', platform);
    }
  }

  await logAudit({ actorId: ctx.id, actorLabel: ctx.email, action: 'update', entityType: 'settings', entityLabel: 'الإعدادات العامة' });
  return { ok: true };
}
