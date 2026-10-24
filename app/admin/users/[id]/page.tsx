import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin, isAdminId } from '@/lib/admin/auth';
import { getUserDetail, userStatus } from '@/lib/admin/queries';
import { fmtDateTime, timeAgo } from '@/lib/admin/format';
import {
  suspendUser,
  unsuspendUser,
  resendConfirmation,
  resetInterviewQuota,
  setPlan,
} from '../../actions';
import {
  Badge,
  Card,
  Notice,
  PageTitle,
  buttonClass,
  dangerButtonClass,
  ghostButtonClass,
} from '../../_components';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminUserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const { user: me, admin } = await requireAdmin();
  const { id } = await params;
  const { notice } = await searchParams;
  if (!UUID.test(id)) notFound();

  const detail = await getUserDetail(admin, id);
  if (!detail) notFound();

  const { user, state, events, audit, counts } = detail;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const name = String(meta.full_name ?? meta.name ?? '') || '—';
  const bannedUntil = (user as { banned_until?: string }).banned_until ?? null;
  const status = userStatus({ banned_until: bannedUntil, email_confirmed_at: user.email_confirmed_at });
  const plan = state?.plan ?? 'free';
  const isSelf = user.id === me.id;
  const targetIsAdmin = await isAdminId(admin, user.id);
  const locked = isSelf || targetIsAdmin;

  return (
    <>
      <Link href="/admin/users" className="mb-4 inline-block text-sm text-slate-400 hover:text-white">
        ← All users
      </Link>
      <PageTitle title={name} subtitle={user.email ?? undefined} />
      <Notice message={notice} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Account">
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-slate-400">Status</dt>
            <dd>
              <Badge tone={status === 'active' ? 'green' : status === 'suspended' ? 'red' : 'amber'}>{status}</Badge>
              {targetIsAdmin ? <span className="ml-2"><Badge tone="purple">admin</Badge></span> : null}
            </dd>
            <dt className="text-slate-400">Plan</dt>
            <dd className="text-slate-200">{plan}</dd>
            <dt className="text-slate-400">Joined</dt>
            <dd className="text-slate-200">{fmtDateTime(user.created_at)}</dd>
            <dt className="text-slate-400">Last sign-in</dt>
            <dd className="text-slate-200">{fmtDateTime(user.last_sign_in_at)} ({timeAgo(user.last_sign_in_at)})</dd>
            <dt className="text-slate-400">Email confirmed</dt>
            <dd className="text-slate-200">{fmtDateTime(user.email_confirmed_at)}</dd>
            <dt className="text-slate-400">Interview quota reset</dt>
            <dd className="text-slate-200">{fmtDateTime(state?.interview_quota_reset_at)}</dd>
            {state?.suspended_reason ? (
              <>
                <dt className="text-slate-400">Suspension reason</dt>
                <dd className="text-slate-200">{state.suspended_reason}</dd>
              </>
            ) : null}
          </dl>
        </Card>

        <Card title="Usage totals">
          <dl className="grid grid-cols-[1fr_auto] gap-y-2 text-sm">
            {counts.map((c) => (
              <div key={c.label} className="contents">
                <dt className="text-slate-400">{c.label}</dt>
                <dd className="text-right text-slate-200">{c.value ?? 'n/a'}</dd>
              </div>
            ))}
          </dl>
          {counts.some((c) => c.value === null) ? (
            <p className="mt-3 text-xs text-slate-500">
              “n/a” means that table was not found. Edit lib/admin/config.ts to match your table names.
            </p>
          ) : null}
        </Card>
      </div>

      <Card title="Actions" className="mt-4">
        {locked ? (
          <p className="text-sm text-slate-400">
            {isSelf ? 'This is your own account.' : 'This user is an admin.'} Actions are disabled to prevent lockouts.
          </p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {status === 'suspended' ? (
              <form action={unsuspendUser} className="space-y-2">
                <input type="hidden" name="userId" value={user.id} />
                <p className="text-sm text-slate-300">Let this user sign in again.</p>
                <button className={buttonClass}>Unsuspend</button>
              </form>
            ) : (
              <form action={suspendUser} className="space-y-2">
                <input type="hidden" name="userId" value={user.id} />
                <p className="text-sm text-slate-300">Block this user from signing in.</p>
                <input
                  name="reason"
                  maxLength={200}
                  placeholder="Reason (optional, saved in the audit log)"
                  className="w-full rounded-lg border border-white/15 bg-[#070b1a] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-[#6d4cff] focus:outline-none"
                />
                <button className={dangerButtonClass}>Suspend user</button>
              </form>
            )}

            <form action={setPlan} className="space-y-2">
              <input type="hidden" name="userId" value={user.id} />
              <p className="text-sm text-slate-300">Change plan (limits are enforced by your app, not by this panel).</p>
              <div className="flex gap-2">
                <select
                  name="plan"
                  defaultValue={plan}
                  className="rounded-lg border border-white/15 bg-[#070b1a] px-3 py-2 text-sm text-white"
                >
                  <option value="free">free</option>
                  <option value="pro">pro</option>
                </select>
                <button className={ghostButtonClass}>Save plan</button>
              </div>
            </form>

            <form action={resetInterviewQuota} className="space-y-2">
              <input type="hidden" name="userId" value={user.id} />
              <p className="text-sm text-slate-300">Give this user a fresh monthly mock interview allowance.</p>
              <button className={ghostButtonClass}>Reset interview quota</button>
            </form>

            {status === 'unconfirmed' ? (
              <form action={resendConfirmation} className="space-y-2">
                <input type="hidden" name="userId" value={user.id} />
                <p className="text-sm text-slate-300">Send the signup confirmation email again.</p>
                <button className={ghostButtonClass}>Resend confirmation email</button>
              </form>
            ) : null}
          </div>
        )}
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Recent activity (last 50)">
          {events.length === 0 ? (
            <p className="text-sm text-slate-400">No activity recorded yet.</p>
          ) : (
            <ul className="max-h-80 divide-y divide-white/5 overflow-y-auto text-sm">
              {events.map((e) => (
                <li key={e.id} className="flex justify-between py-2">
                  <span className="text-slate-200">{e.event_type}</span>
                  <span className="text-slate-500">{timeAgo(e.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Admin actions on this user">
          {audit.length === 0 ? (
            <p className="text-sm text-slate-400">No admin actions yet.</p>
          ) : (
            <ul className="max-h-80 divide-y divide-white/5 overflow-y-auto text-sm">
              {audit.map((a) => (
                <li key={a.id} className="py-2">
                  <p className="text-slate-200">{a.action}</p>
                  <p className="text-xs text-slate-500">
                    {a.admin_email} · {fmtDateTime(a.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
