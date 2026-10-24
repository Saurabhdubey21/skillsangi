import { createUserClient } from '@/lib/admin/supabase-user';
import { isEventType } from '@/lib/admin/events';

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    type?: unknown;
    metadata?: unknown;
  } | null;

  if (!body || !isEventType(body.type)) {
    return Response.json({ error: 'Unknown event type' }, { status: 400 });
  }

  const metadata =
    body.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)
      ? (body.metadata as Record<string, unknown>)
      : {};
  if (JSON.stringify(metadata).length > 2000) {
    return Response.json({ error: 'Metadata too large' }, { status: 400 });
  }

  const supabase = await createUserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Not signed in' }, { status: 401 });

  // Row-level security also enforces user_id = auth.uid().
  const { error } = await supabase
    .from('events')
    .insert({ user_id: user.id, event_type: body.type, metadata });
  if (error) return Response.json({ error: 'Could not record event' }, { status: 500 });

  return Response.json({ ok: true });
}
