// Shared list of activity events the app is allowed to record.
// Add new names here first; /api/track rejects anything not on this list.

export const ALLOWED_EVENTS = [
  'dashboard_view',
  'roadmap_created',
  'roadmap_deleted',
  'task_completed',
  'practice_opened',
  'practice_result',
  'ai_teacher_message',
  'code_editor_run',
  'mock_interview_started',
  'mock_interview_completed',
] as const;

export type EventType = (typeof ALLOWED_EVENTS)[number];

export function isEventType(value: unknown): value is EventType {
  return typeof value === 'string' && (ALLOWED_EVENTS as readonly string[]).includes(value);
}
