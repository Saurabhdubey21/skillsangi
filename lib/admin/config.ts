// Table names match the real SkillSangi Supabase tables.
// Each entry shows "how many rows in <table> belong to this user" on the admin user page.
// If a table or column is wrong, that count shows "n/a" instead of crashing.

export interface ProductCount {
  label: string;      // shown in the admin panel
  table: string;      // your table name
  userColumn: string; // the column that holds the student's user id (uuid)
}

export const PRODUCT_COUNTS: ProductCount[] = [
  { label: 'Roadmaps', table: 'roadmaps', userColumn: 'user_id' },
  { label: 'Practice questions tracked', table: 'problem_progress', userColumn: 'user_id' },
  { label: 'Mock interviews started', table: 'interviews', userColumn: 'user_id' },
  { label: 'AI Teacher chats', table: 'chat_threads', userColumn: 'user_id' },
  { label: 'Code editor attempts', table: 'code_attempts', userColumn: 'user_id' },
];