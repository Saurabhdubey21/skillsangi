import 'server-only';
import type { AdminClient } from './supabase-admin';

export interface AuditEntry {
  adminId: string;
  adminEmail?: string | null;
  action: string; // e.g. "user.suspend"
  targetUserId?: string;
  targetEmail?: string | null;
  details?: Record<string, unknown>;
}

// Fail-closed: if the audit row cannot be written, the caller must not
// perform the action. Always call this BEFORE the change itself.
export async function writeAudit(admin: AdminClient, entry: AuditEntry) {
  const { error } = await admin.from('admin_audit_log').insert({
    admin_id: entry.adminId,
    admin_email: entry.adminEmail ?? null,
    action: entry.action,
    target_user_id: entry.targetUserId ?? null,
    target_email: entry.targetEmail ?? null,
    details: entry.details ?? {},
  });
  if (error) throw new Error(`Audit log write failed: ${error.message}`);
}
