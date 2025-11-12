import { createClient } from "@/lib/supabase/server"

async function hashToken(token: string): Promise<string> {
  // Use Web Crypto API for hashing (works in both Node.js and browser)
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

export interface AttendanceSubmission {
  id?: string
  session_id: string
  student_id: string
  timestamp: string
  selfie_image?: string
  liveness_action?: string
  verified: boolean
  qr_token_hash?: string
  ip_address?: string
  user_agent?: string
  created_at?: string
}

export interface CreateSubmissionParams {
  sessionId: string
  studentId: string
  selfieImage?: string
  livenessAction?: string
  verified: boolean
  qrToken?: string
  ipAddress?: string
  userAgent?: string
}

export async function createSubmission(params: CreateSubmissionParams): Promise<AttendanceSubmission> {
  const supabase = await createClient()

  // Check for duplicate submission
  const { data: existing } = await supabase
    .from("attendance_submissions")
    .select("id")
    .eq("session_id", params.sessionId)
    .eq("student_id", params.studentId)
    .single()

  if (existing) {
    throw new Error("Student has already submitted attendance for this session")
  }

  // Hash QR token for verification tracking
  const qrTokenHash = params.qrToken
    ? await hashToken(params.qrToken)
    : null

  const { data, error } = await supabase
    .from("attendance_submissions")
    .insert({
      session_id: params.sessionId,
      student_id: params.studentId,
      timestamp: new Date().toISOString(),
      selfie_image: params.selfieImage,
      liveness_action: params.livenessAction,
      verified: params.verified,
      qr_token_hash: qrTokenHash,
      ip_address: params.ipAddress,
      user_agent: params.userAgent,
    })
    .select()
    .single()

  if (error) {
    if (error.code === "23505") {
      // Unique constraint violation
      throw new Error("Student has already submitted attendance for this session")
    }
    throw new Error(`Failed to create submission: ${error.message}`)
  }

  return data
}

export async function getSubmissions(sessionId: string): Promise<AttendanceSubmission[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("attendance_submissions")
    .select("*")
    .eq("session_id", sessionId)
    .order("timestamp", { ascending: false })

  if (error) {
    throw new Error(`Failed to get submissions: ${error.message}`)
  }

  return data || []
}

export async function getSubmissionsByTeacher(
  teacherId: string,
  sessionId: string
): Promise<(AttendanceSubmission & { student_name?: string; student_email?: string })[]> {
  const supabase = await createClient()

  // Verify teacher owns the session and get class_id
  const { data: session } = await supabase
    .from("sessions")
    .select("id, class_id")
    .eq("id", sessionId)
    .eq("teacher_id", teacherId)
    .single()

  if (!session) {
    throw new Error("Session not found or access denied")
  }

  // Get submissions with student details if class_id exists
  if (session.class_id) {
    // First get all submissions
    const { data: submissions, error: submissionsError } = await supabase
      .from("attendance_submissions")
      .select("*")
      .eq("session_id", sessionId)
      .order("timestamp", { ascending: false })

    if (submissionsError) {
      throw new Error(`Failed to get submissions: ${submissionsError.message}`)
    }

    if (!submissions || submissions.length === 0) {
      return []
    }

    // Get all student IDs from submissions
    const studentIds = submissions.map(s => s.student_id)

    // Get student details for this class
    const { data: students, error: studentsError } = await supabase
      .from("students")
      .select("student_id, name, email")
      .eq("class_id", session.class_id)
      .in("student_id", studentIds)

    if (studentsError) {
      console.warn("Failed to get student details:", studentsError.message)
      // Return submissions without student details if lookup fails
      return submissions
    }

    // Create a map of student_id -> student details
    const studentMap = new Map(
      (students || []).map(s => [s.student_id, s])
    )

    // Map submissions with student details
    return submissions.map((submission: any) => {
      const student = studentMap.get(submission.student_id)
      return {
        ...submission,
        student_name: student?.name,
        student_email: student?.email,
      }
    })
  }

  // If no class_id, just return submissions without student details
  return getSubmissions(sessionId)
}

export async function getSubmissionCount(sessionId: string): Promise<number> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from("attendance_submissions")
    .select("*", { count: "exact", head: true })
    .eq("session_id", sessionId)

  if (error) {
    throw new Error(`Failed to get submission count: ${error.message}`)
  }

  return count || 0
}

