import { createClient } from "@/lib/supabase/server"
import { AuthenticationError } from "./errors"

export async function requireAuth() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new AuthenticationError("Not authenticated")
  }

  return { user, supabase }
}

export async function getOptionalAuth() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { user, supabase }
}

