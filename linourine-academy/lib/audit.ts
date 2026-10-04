import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { getClientIp, hashValue } from '@/lib/hash';

type AuditInput = {
  actorId: string | null;
  actorLabel: string;
  action: 'create' | 'update' | 'delete' | 'publish' | 'unpublish' | 'login' | 'logout' | 'status_change';
  entityType: string;
  entityId?: string;
  entityLabel?: string;
  changes?: Record<string, unknown>;
};

/** Never throws: a logging failure must not break the user's action. */
export async function logAudit(input: AuditInput) {
  try {
    const ip = await getClientIp();
    await createAdminClient().from('audit_logs').insert({
      actor_id: input.actorId,
      actor_label: input.actorLabel,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      entity_label: input.entityLabel ?? null,
      changes: input.changes ?? null,
      ip_hash: hashValue(ip),
    });
  } catch (error) {
    console.error('audit log failed', error);
  }
}
