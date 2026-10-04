import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * Service-role client: BYPASSES RLS. Use only in server code, only after validating the input,
 * and only for things visitors may not do directly (registrations, audit log, analytics).
 */
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
