import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/auth';
import { listAudit, AUDIT_PAGE_SIZE } from '@/lib/admin/queries';
import { fmtDateTime } from '@/lib/admin/format';
import { Card, PageTitle } from '../_components';

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { admin } = await requireAdmin();
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);

  const { rows, total } = await listAudit(admin, page);
  const pages = Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE));

  return (
    <>
      <PageTitle title="Audit log" subtitle="Every admin action, newest first. This log cannot be edited or deleted." />

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Admin</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Target</th>
              <th className="px-4 py-3 font-medium">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No admin actions yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-300">{fmtDateTime(r.created_at)}</td>
                  <td className="px-4 py-3 text-slate-300">{r.admin_email ?? '—'}</td>
                  <td className="px-4 py-3 text-white">{r.action}</td>
                  <td className="px-4 py-3">
                    {r.target_user_id ? (
                      <Link href={`/admin/users/${r.target_user_id}`} className="text-[#b9a8ff] hover:underline">
                        {r.target_email ?? r.target_user_id}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-xs text-slate-500">
                    {Object.keys(r.details ?? {}).length ? JSON.stringify(r.details) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {pages > 1 ? (
        <div className="mt-4 flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link href={`/admin/audit?page=${page - 1}`} className="text-[#b9a8ff] hover:underline">
              ← Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="text-slate-400">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={`/admin/audit?page=${page + 1}`} className="text-[#b9a8ff] hover:underline">
              Older →
            </Link>
          ) : (
            <span />
          )}
        </div>
      ) : null}
    </>
  );
}
