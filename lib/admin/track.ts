import 'server-only';
import { createUserClient } from './supabase-user';
import type { EventType } from './events';

// Record an activity event from server code (server actions, route handlers).
// Never throws: tracking must not break the feature it is attached to.
//
//   import { trackServer } from '@/lib/admin/track';
//   await trackServer('mock_interview_started', { round: 'coding' });
//
// Keep metadata small and non-sensitive (ids, round names, counts).
// Never put answers, resume text or code in metadata.
export async function trackServer(type: EventType, metadata: Record<string, unknown> = {}) {
  try {
    const supabase = await createUserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('events').insert({ user_id: user.id, event_type: type, metadata });
  } catch {
    // ignore
  }
}
