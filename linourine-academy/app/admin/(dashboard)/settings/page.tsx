import type { Metadata } from 'next';
import { PageHeader } from '@/components/admin/page-header';
import { SettingsForm } from '@/components/admin/settings-form';
import { requirePermission } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'الإعدادات العامة' };

export default async function SettingsPage() {
  await requirePermission('manage_settings');
  const supabase = await createClient();
  const [{ data: rows }, { data: links }] = await Promise.all([
    supabase.from('settings').select('key, value'),
    supabase.from('social_links').select('platform, url'),
  ]);

  const values: Record<string, string> = {};
  for (const r of rows ?? []) {
    const v = r.value as unknown;
    values[r.key] = typeof v === 'string' ? v : Array.isArray(v) ? v.join('\n') : '';
  }
  for (const l of links ?? []) values[`social.${l.platform}`] = l.url;

  return (
    <>
      <PageHeader title="الإعدادات العامة" description="تُطبَّق هذه القيم فوراً على الموقع العام." />
      <SettingsForm values={values} />
    </>
  );
}
