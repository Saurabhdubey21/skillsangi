import { requireAdmin } from '@/lib/admin/auth';
import { getOverview } from '@/lib/admin/queries';
import { fmtShortDay } from '@/lib/admin/format';
import { Card, PageTitle, Stat } from './_components';

export default async function AdminOverviewPage() {
  const { admin } = await requireAdmin();
  const { stats, active, signups, topEvents } = await getOverview(admin);

  const maxSignups = Math.max(1, ...signups.map((d) => Number(d.signups)));

  return (
    <>
      <PageTitle title="Overview" subtitle="Live numbers from your Supabase project. Times are in IST." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total users" value={stats?.total_users ?? 0} hint={`${stats?.confirmed_users ?? 0} confirmed`} />
        <Stat label="Waiting to confirm email" value={stats?.pending_users ?? 0} hint="Signed up, not yet verified" />
        <Stat label="Signups, 7 days" value={stats?.signups_7d ?? 0} hint={`${stats?.signups_30d ?? 0} in 30 days`} />
        <Stat label="Suspended" value={stats?.banned_users ?? 0} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <Stat label="Active today" value={active?.dau ?? 0} hint="DAU" />
        <Stat label="Active, 7 days" value={active?.wau ?? 0} hint="WAU" />
        <Stat label="Active, 30 days" value={active?.mau ?? 0} hint="MAU" />
      </div>

      <Card title="Signups per day, last 30 days" className="mt-4">
        <div className="flex h-40 items-end gap-1" role="img" aria-label="Bar chart of daily signups">
          {signups.map((d) => (
            <div key={d.day} className="group relative flex h-full flex-1 items-end">
              <div
                className="w-full rounded-t bg-[#6d4cff]/80 transition group-hover:bg-[#8f78ff]"
                style={{ height: `${(Number(d.signups) / maxSignups) * 100}%`, minHeight: Number(d.signups) > 0 ? 4 : 1 }}
              />
              <span className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-0.5 text-xs text-white group-hover:block">
                {fmtShortDay(d.day)}: {d.signups}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-slate-500">
          <span>{signups[0] ? fmtShortDay(signups[0].day) : ''}</span>
          <span>{signups.length ? fmtShortDay(signups[signups.length - 1].day) : ''}</span>
        </div>
      </Card>

      <Card title="Most common activity, last 7 days" className="mt-4">
        {topEvents.length === 0 ? (
          <p className="text-sm text-slate-400">
            No activity events yet. Add track() calls in the app (see ADMIN_README.md) and they will appear here.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="pb-2 font-medium">Event</th>
                <th className="pb-2 text-right font-medium">Count</th>
                <th className="pb-2 text-right font-medium">Users</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {topEvents.map((e) => (
                <tr key={e.event_type}>
                  <td className="py-2 text-slate-200">{e.event_type}</td>
                  <td className="py-2 text-right text-slate-300">{e.total}</td>
                  <td className="py-2 text-right text-slate-300">{e.users}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
