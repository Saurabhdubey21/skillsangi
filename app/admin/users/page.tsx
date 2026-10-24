import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/auth';
import { listUsers, userStatus, USERS_PAGE_SIZE } from '@/lib/admin/queries';
import { fmtDate, timeAgo } from '@/lib/admin/format';
import { Badge, Card, PageTitle, buttonClass } from '../_components';

type SearchParams = Promise<{ q?: string; page?: string; sort?: string }>;

export default async function AdminUsersPage({ searchParams }: { searchParams: SearchParams }) {
  const { admin } = await requireAdmin();
  const sp = await searchParams;

  const q = (sp.q ?? '').trim().slice(0, 100);
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const sort = sp.sort === 'last_active' ? 'last_active' : 'newest';

  const { rows, total } = await listUsers(admin, { q, page, sort });
  const pages = Math.max(1, Math.ceil(total / USERS_PAGE_SIZE));

  const link = (over: Record<string, string>) => {
    const params = new URLSearchParams();
    const merged = { q, sort, page: String(page), ...over };
    for (const [k, v] of Object.entries(merged)) if (v && !(k === 'page' && v === '1') && !(k === 'sort' && v === 'newest')) params.set(k, v);
    const qs = params.toString();
    return qs ? `/admin/users?${qs}` : '/admin/users';
  };

  return (
    <>
      <PageTitle title="Users" subtitle={`${total} ${total === 1 ? 'user' : 'users'}${q ? ` matching "${q}"` : ''}`} />

      <form className="mb-4 flex flex-wrap gap-2" action="/admin/users">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name or email"
          maxLength={100}
          className="min-w-0 flex-1 rounded-lg border border-white/15 bg-[#0f1528] px-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:border-[#6d4cff] focus:outline-none"
        />
        {sort !== 'newest' ? <input type="hidden" name="sort" value={sort} /> : null}
        <button className={buttonClass}>Search</button>
      </form>

      <div className="mb-3 flex gap-3 text-sm">
        <Link href={link({ sort: 'newest', page: '1' })} className={sort === 'newest' ? 'text-white' : 'text-slate-400 hover:text-white'}>
          Newest
        </Link>
        <Link href={link({ sort: 'last_active', page: '1' })} className={sort === 'last_active' ? 'text-white' : 'text-slate-400 hover:text-white'}>
          Last active
        </Link>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Last active</th>
              <th className="px-4 py-3 text-right font-medium">Events, 30d</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  No users found.
                </td>
              </tr>
            ) : (
              rows.map((u) => {
                const status = userStatus(u);
                return (
                  <tr key={u.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{u.full_name || '—'}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={status === 'active' ? 'green' : status === 'suspended' ? 'red' : 'amber'}>{status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={u.plan === 'pro' ? 'purple' : 'slate'}>{u.plan}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{fmtDate(u.created_at)}</td>
                    <td className="px-4 py-3 text-slate-300">{timeAgo(u.last_sign_in_at)}</td>
                    <td className="px-4 py-3 text-right text-slate-300">{u.events_30d}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/users/${u.id}`} className="text-[#b9a8ff] hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>

      {pages > 1 ? (
        <div className="mt-4 flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link href={link({ page: String(page - 1) })} className="text-[#b9a8ff] hover:underline">
              ← Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-slate-400">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={link({ page: String(page + 1) })} className="text-[#b9a8ff] hover:underline">
              Next →
            </Link>
          ) : (
            <span />
          )}
        </div>
      ) : null}
    </>
  );
}
