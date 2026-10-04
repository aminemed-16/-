import 'server-only';
import { createHash } from 'node:crypto';
import { headers } from 'next/headers';

export function hashValue(value: string) {
  return createHash('sha256')
    .update(`${process.env.IP_HASH_SALT ?? ''}:${value}`)
    .digest('hex');
}

export async function getClientIp() {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
}
