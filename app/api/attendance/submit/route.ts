import { type NextRequest, NextResponse } from "next/server"
import { verifyQRPayload, type QRPayload } from "@/lib/crypto"
import { createSubmission } from "@/lib/db/submissions"
import { getSession } from "@/lib/db/sessions"
import { handleApiError, ConflictError, NotFoundError, ValidationError } from "@/lib/api/errors"
import { validateRequired, validateStudentId, validateSessionId } from "@/lib/api/validation"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, sessionId, token, timestamp, selfieImage, livenessAction } = body

    // Validate required fields
    validateRequired(body, ["studentId", "sessionId", "token"])
    
    // Validate field formats
    const validatedStudentId = validateStudentId(studentId)
    const validatedSessionId = validateSessionId(sessionId)

    // Parse and verify the QR payload
    let payload: QRPayload
    try {
      payload = JSON.parse(token)
    } catch (error) {
      throw new ValidationError("Invalid token format")
    }

    const secret = process.env.HMAC_SECRET || "default-secret-key"
    const isValid = await verifyQRPayload(payload, secret)

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      )
    }

    // Verify session ID matches token
    if (payload.sid !== validatedSessionId) {
      return NextResponse.json(
        { error: "Session ID mismatch" },
        { status: 400 }
      )
    }

    // Check if session exists and is active
    const session = await getSession(validatedSessionId)
    if (!session) {
      throw new NotFoundError("Session")
    }

    if (!session.is_active) {
      return NextResponse.json(
        { error: "Session is not active" },
        { status: 403 }
      )
    }

    // Check if session has expired
    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Session has expired" },
        { status: 403 }
      )
    }

    // Get client info for audit trail
    const ipAddress = request.headers.get("x-forwarded-for") || 
                     request.headers.get("x-real-ip") || 
                     "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    // Create submission
    try {
      const submission = await createSubmission({
        sessionId: validatedSessionId,
        studentId: validatedStudentId,
        selfieImage: selfieImage || undefined,
        livenessAction: livenessAction || undefined,
        verified: isValid,
        qrToken: token,
        ipAddress,
        userAgent,
      })

      console.log("[Submit API] Submission created:", {
        id: submission.id,
        studentId: validatedStudentId,
        sessionId: validatedSessionId,
      })

      return NextResponse.json({
        success: true,
        message: "Attendance marked successfully",
        submission: {
          id: submission.id,
          studentId: validatedStudentId,
          timestamp: submission.timestamp,
        },
      })
    } catch (error) {
      if (error instanceof Error && error.message.includes("already submitted")) {
        throw new ConflictError("Student has already submitted attendance for this session")
      }
      throw error
    }
  } catch (error) {
    return handleApiError(error)
  }
}
