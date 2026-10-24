import 'server-only';
import { connection } from 'next/server';
import { notFound, redirect } from 'next/navigation';
import { createUserClient } from './supabase-user';
import { createAdminClient, type AdminClient } from './supabase-admin';

// The one gatekeeper for the admin panel.
// Call it at the top of EVERY admin page, layout and server action.
// A layout check alone is not enough: Next.js does not re-run layouts on every
// navigation, and server actions can be called directly.
//
// - Not signed in        -> redirected to /login
// - Signed in, not admin -> 404 (the page looks like it does not exist)
export async function requireAdmin() {
  // Admin pages are always rendered per request, never prerendered.
  await connection();

  const supabase = await createUserClient();

  // getUser() re-validates the token with Supabase. Never use getSession() for auth checks.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || !data) notFound();

  return { user, admin };
}

export async function isAdminId(admin: AdminClient, userId: string) {
  const { data } = await admin
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  return Boolean(data);
}