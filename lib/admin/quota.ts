import 'server-only';
import type { AdminClient } from './supabase-admin';

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

// Start of the current calendar month in India time.
export function startOfMonthIST(now = new Date()): Date {
  const shifted = new Date(now.getTime() + IST_OFFSET_MS);
  return new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), 1) - IST_OFFSET_MS);
}

// USE THIS in your mock-interview start check.
// Count only the interviews created AFTER this moment. It is the later of
// "start of this month" and "when an admin last reset this user's quota".
//
//   const cutoff = await getInterviewQuotaCutoff(admin, user.id);
//   const { count } = await admin.from('<your interviews table>')
//     .select('*', { count: 'exact', head: true })
//     .eq('user_id', user.id)
//     .gte('created_at', cutoff.toISOString());
//   if ((count ?? 0) >= 2) -> block with a friendly "monthly limit reached" message
export async function getInterviewQuotaCutoff(admin: AdminClient, userId: string): Promise<Date> {
  const monthStart = startOfMonthIST();
  const { data } = await admin
    .from('user_admin_state')
    .select('interview_quota_reset_at')
    .eq('user_id', userId)
    .maybeSingle();

  const resetAt = data?.interview_quota_reset_at ? new Date(data.interview_quota_reset_at) : null;
  return resetAt && resetAt > monthStart ? resetAt : monthStart;
}
