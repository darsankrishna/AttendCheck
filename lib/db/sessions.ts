import { createClient } from "@/lib/supabase/server"
import { generateSessionId } from "@/lib/crypto"

export interface Session {
  id: string
  teacher_id: string
  class_id?: string
  created_at: string
  expires_at: string
  is_active: boolean
  metadata?: Record<string, any>
}

export interface CreateSessionParams {
  teacherId: string
  classId?: string
  expiryTime?: number // in seconds, default 600 (10 minutes)
  metadata?: Record<string, any>
}

export async function createSession(params: CreateSessionParams): Promise<Session> {
  const supabase = await createClient()
  const sessionId = generateSessionId()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + (params.expiryTime || 600) * 1000)

  const { data, error } = await supabase
    .from("sessions")
    .insert({
      id: sessionId,
      teacher_id: params.teacherId,
      class_id: params.classId,
      expires_at: expiresAt.toISOString(),
      is_active: true,
      metadata: params.metadata || {},
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create session: ${error.message}`)
  }

  return data
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return null // Not found
    }
    throw new Error(`Failed to get session: ${error.message}`)
  }

  return data
}

export async function getSessionByTeacher(teacherId: string, sessionId: string): Promise<Session | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("teacher_id", teacherId)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return null
    }
    throw new Error(`Failed to get session: ${error.message}`)
  }

  return data
}

export async function stopSession(sessionId: string, teacherId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("sessions")
    .update({ is_active: false })
    .eq("id", sessionId)
    .eq("teacher_id", teacherId)

  if (error) {
    throw new Error(`Failed to stop session: ${error.message}`)
  }
}

export async function cleanupExpiredSessions(): Promise<number> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("sessions")
    .update({ is_active: false })
    .eq("is_active", true)
    .lt("expires_at", new Date().toISOString())
    .select()

  if (error) {
    throw new Error(`Failed to cleanup sessions: ${error.message}`)
  }

  return data?.length || 0
}

