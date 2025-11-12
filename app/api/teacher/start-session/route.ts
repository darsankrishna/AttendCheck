import { type NextRequest, NextResponse } from "next/server"
import { createSession } from "@/lib/db/sessions"
import { requireAuth } from "@/lib/api/auth"
import { handleApiError, ValidationError } from "@/lib/api/errors"
import { validateString } from "@/lib/api/validation"

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth()
    
    const body = await request.json().catch(() => ({}))
    const { classId, expiryTime } = body

    // Validate expiry time if provided
    const validatedExpiryTime = expiryTime 
      ? Math.max(60, Math.min(3600, Number(expiryTime))) // Between 1 min and 1 hour
      : 600 // Default 10 minutes

    const session = await createSession({
      teacherId: user.id,
      classId: classId || undefined,
      expiryTime: validatedExpiryTime,
    })

    console.log("[Start Session] Session created:", {
      sessionId: session.id,
      teacherId: user.id,
      expiresAt: session.expires_at,
    })

    return NextResponse.json({
      sessionId: session.id,
      expiresAt: session.expires_at,
      createdAt: session.created_at,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
