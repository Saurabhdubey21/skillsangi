'use client';
import type { EventType } from './events';

// Record an activity event from a client component.
//
//   import { track } from '@/lib/admin/track-client';
//   track('task_completed', { roadmap: 'cpp' });
//
// Fire-and-forget. Keep metadata small and non-sensitive.
export function track(type: EventType, metadata: Record<string, unknown> = {}) {
  try {
    void fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, metadata }),
      keepalive: true,
    });
  } catch {
    // ignore
  }
}
