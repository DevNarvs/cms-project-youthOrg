import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Typed helper utilities to perform table operations with compile-time checks
export async function insertRow<T extends keyof Database['public']['Tables']>(
  table: T,
  values: Database['public']['Tables'][T]['Insert'] | Database['public']['Tables'][T]['Insert'][]
) {
  return (supabase as any).from(table as unknown as string).insert(values as any);
}

export async function updateRow<T extends keyof Database['public']['Tables']>(
  table: T,
  values: Database['public']['Tables'][T]['Update'],
  where?: Record<string, unknown>
) {
  let q: any = (supabase as any).from(table as unknown as string).update(values as any);
  if (where) q = q.match(where);
  return q;
}
