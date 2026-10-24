import 'server-only';
import type { AdminClient } from './supabase-admin';
import { PRODUCT_COUNTS } from './config';

export interface OverviewStats {
  total_users: number;
  confirmed_users: number;
  pending_users: number;
  banned_users: number;
  signups_7d: number;
  signups_30d: number;
}
export interface ActiveCounts { dau: number; wau: number; mau: number }
export interface SignupDay { day: string; signups: number }
export interface TopEvent { event_type: string; total: number; users: number }

export interface AdminUserRow {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  banned_until: string | null;
  plan: string;
  events_30d: number;
  total_count: number;
}

export type UserStatus = 'suspended' | 'unconfirmed' | 'active';

export function userStatus(u: { banned_until?: string | null; email_confirmed_at?: string | null }): UserStatus {
  if (u.banned_until && new Date(u.banned_until) > new Date()) return 'suspended';
  if (!u.email_confirmed_at) return 'unconfirmed';
  return 'active';
}

export async function getOverview(admin: AdminClient) {
  const [stats, active, signups, topEvents] = await Promise.all([
    admin.rpc('admin_overview_stats'),
    admin.rpc('admin_active_counts'),
    admin.rpc('admin_signups_per_day', { p_days: 30 }),
    admin.rpc('admin_top_events', { p_days: 7 }),
  ]);
  for (const r of [stats, active, signups, topEvents]) {
    if (r.error) throw new Error(r.error.message);
  }
  return {
    stats: (stats.data?.[0] ?? null) as OverviewStats | null,
    active: (active.data?.[0] ?? null) as ActiveCounts | null,
    signups: (signups.data ?? []) as SignupDay[],
    topEvents: (topEvents.data ?? []) as TopEvent[],
  };
}

export const USERS_PAGE_SIZE = 25;

export async function listUsers(
  admin: AdminClient,
  opts: { q: string; page: number; sort: 'newest' | 'last_active' },
) {
  const { data, error } = await admin.rpc('admin_list_users', {
    p_search: opts.q,
    p_limit: USERS_PAGE_SIZE,
    p_offset: (opts.page - 1) * USERS_PAGE_SIZE,
    p_sort: opts.sort,
  });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as AdminUserRow[];
  return { rows, total: rows[0]?.total_count ?? 0 };
}

export async function getUserDetail(admin: AdminClient, id: string) {
  // Everything runs in one parallel batch (one round trip of waiting, not two).
  const [authRes, stateRes, eventsRes, auditRes, counts] = await Promise.all([
    admin.auth.admin.getUserById(id),
    admin.from('user_admin_state').select('*').eq('user_id', id).maybeSingle(),
    // Event type and time only. Metadata is deliberately not shown (privacy).
    admin
      .from('events')
      .select('id, event_type, created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(50),
    admin
      .from('admin_audit_log')
      .select('id, admin_email, action, details, created_at')
      .eq('target_user_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
    Promise.all(
      PRODUCT_COUNTS.map(async (c) => {
        const { count, error } = await admin
          .from(c.table)
          .select('*', { count: 'exact', head: true })
          .eq(c.userColumn, id);
        return { label: c.label, value: error ? null : (count ?? 0) };
      }),
    ),
  ]);

  if (authRes.error || !authRes.data.user) return null;

  return {
    user: authRes.data.user,
    state: stateRes.data as {
      plan: string;
      suspended: boolean;
      suspended_reason: string | null;
      interview_quota_reset_at: string | null;
    } | null,
    events: (eventsRes.data ?? []) as { id: number; event_type: string; created_at: string }[],
    audit: (auditRes.data ?? []) as {
      id: number;
      admin_email: string | null;
      action: string;
      details: Record<string, unknown>;
      created_at: string;
    }[],
    counts,
  };
}

export const AUDIT_PAGE_SIZE = 50;

export async function listAudit(admin: AdminClient, page: number) {
  const from = (page - 1) * AUDIT_PAGE_SIZE;
  const { data, error, count } = await admin
    .from('admin_audit_log')
    .select('id, admin_email, action, target_user_id, target_email, details, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + AUDIT_PAGE_SIZE - 1);
  if (error) throw new Error(error.message);
  return {
    rows: (data ?? []) as {
      id: number;
      admin_email: string | null;
      action: string;
      target_user_id: string | null;
      target_email: string | null;
      details: Record<string, unknown>;
      created_at: string;
    }[],
    total: count ?? 0,
  };
}