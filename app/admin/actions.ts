'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin, isAdminId } from '@/lib/admin/auth';
import { writeAudit } from '@/lib/admin/audit';
import type { AdminClient } from '@/lib/admin/supabase-admin';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// About 100 years. Supabase treats this as "banned until then".
const BAN_FOREVER = '876000h';

function back(userId: string, notice: string): never {
  redirect(`/admin/users/${userId}?notice=${encodeURIComponent(notice)}`);
}

// Validates the target and refuses to act on yourself or on another admin.
async function loadTarget(admin: AdminClient, adminId: string, formData: FormData) {
  const id = String(formData.get('userId') ?? '');
  if (!UUID.test(id)) redirect('/admin/users');
  if (id === adminId) back(id, 'You cannot perform this action on your own account.');
  if (await isAdminId(admin, id)) back(id, 'You cannot perform this action on another admin.');

  const { data, error } = await admin.auth.admin.getUserById(id);
  if (error || !data.user) redirect('/admin/users');
  return data.user;
}

export async function suspendUser(formData: FormData) {
  const { user, admin } = await requireAdmin();
  const target = await loadTarget(admin, user.id, formData);
  const reason = String(formData.get('reason') ?? '').trim().slice(0, 200);

  await writeAudit(admin, {
    adminId: user.id,
    adminEmail: user.email,
    action: 'user.suspend',
    targetUserId: target.id,
    targetEmail: target.email,
    details: { reason },
  });

  // Supabase enforces the ban: the user cannot sign in or refresh their session.
  // An access token that is already issued can still work until it expires (about 1 hour).
  const { error } = await admin.auth.admin.updateUserById(target.id, { ban_duration: BAN_FOREVER });
  if (error) back(target.id, `Could not suspend: ${error.message}`);

  await admin.from('user_admin_state').upsert({
    user_id: target.id,
    suspended: true,
    suspended_reason: reason || null,
    updated_at: new Date().toISOString(),
  });

  revalidatePath('/admin/users');
  back(target.id, 'User suspended.');
}

export async function unsuspendUser(formData: FormData) {
  const { user, admin } = await requireAdmin();
  const target = await loadTarget(admin, user.id, formData);

  await writeAudit(admin, {
    adminId: user.id,
    adminEmail: user.email,
    action: 'user.unsuspend',
    targetUserId: target.id,
    targetEmail: target.email,
  });

  const { error } = await admin.auth.admin.updateUserById(target.id, { ban_duration: 'none' });
  if (error) back(target.id, `Could not unsuspend: ${error.message}`);

  await admin.from('user_admin_state').upsert({
    user_id: target.id,
    suspended: false,
    suspended_reason: null,
    updated_at: new Date().toISOString(),
  });

  revalidatePath('/admin/users');
  back(target.id, 'User unsuspended.');
}

export async function resendConfirmation(formData: FormData) {
  const { user, admin } = await requireAdmin();
  const target = await loadTarget(admin, user.id, formData);

  if (target.email_confirmed_at) back(target.id, 'This email is already confirmed.');
  if (!target.email) back(target.id, 'This user has no email address.');

  await writeAudit(admin, {
    adminId: user.id,
    adminEmail: user.email,
    action: 'user.resend_confirmation',
    targetUserId: target.id,
    targetEmail: target.email,
  });

  const { error } = await admin.auth.resend({ type: 'signup', email: target.email! });
  if (error) back(target.id, `Could not send: ${error.message}`);

  back(target.id, 'Confirmation email sent.');
}

export async function resetInterviewQuota(formData: FormData) {
  const { user, admin } = await requireAdmin();
  const target = await loadTarget(admin, user.id, formData);

  await writeAudit(admin, {
    adminId: user.id,
    adminEmail: user.email,
    action: 'user.reset_interview_quota',
    targetUserId: target.id,
    targetEmail: target.email,
  });

  const { error } = await admin.from('user_admin_state').upsert({
    user_id: target.id,
    interview_quota_reset_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (error) back(target.id, `Could not reset: ${error.message}`);

  revalidatePath(`/admin/users/${target.id}`);
  back(target.id, 'Interview quota reset. Your interview check must use getInterviewQuotaCutoff() for this to take effect.');
}

export async function setPlan(formData: FormData) {
  const { user, admin } = await requireAdmin();
  const target = await loadTarget(admin, user.id, formData);

  const plan = String(formData.get('plan') ?? '');
  if (plan !== 'free' && plan !== 'pro') back(target.id, 'Unknown plan.');

  await writeAudit(admin, {
    adminId: user.id,
    adminEmail: user.email,
    action: 'user.set_plan',
    targetUserId: target.id,
    targetEmail: target.email,
    details: { plan },
  });

  const { error } = await admin.from('user_admin_state').upsert({
    user_id: target.id,
    plan,
    updated_at: new Date().toISOString(),
  });
  if (error) back(target.id, `Could not change plan: ${error.message}`);

  revalidatePath('/admin/users');
  back(target.id, `Plan set to ${plan}.`);
}
