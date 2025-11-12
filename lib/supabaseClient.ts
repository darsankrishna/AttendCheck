import { createClient } from '@supabase/supabase-js'

const globalForSupabase = globalThis as unknown as { supabase?: ReturnType<typeof createClient> }

export const supabase =
  globalForSupabase.supabase ??
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storageKey: 'v0-auth', // optional but helps avoid collisions
      },
    }
  )

if (!globalForSupabase.supabase) {
  globalForSupabase.supabase = supabase
}
