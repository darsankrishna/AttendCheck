import { type NextRequest, NextResponse } from "next/server"
import { getSubmissionsByTeacher } from "@/lib/db/submissions"
import { requireAuth } from "@/lib/api/auth"
import { handleApiError, ValidationError, NotFoundError } from "@/lib/api/errors"
import { validateSessionId } from "@/lib/api/validation"

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth()
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")

    if (!sessionId) {
      throw new ValidationError("sessionId is required")
    }

    const validatedSessionId = validateSessionId(sessionId)

    const submissions = await getSubmissionsByTeacher(user.id, validatedSessionId)

    console.log("[Submissions API] Fetching submissions for sessionId:", validatedSessionId, "Count:", submissions.length)

    return NextResponse.json({
      sessionId: validatedSessionId,
      submissions: submissions.map((s) => ({
        studentId: s.student_id,
        studentName: s.student_name,
        studentEmail: s.student_email,
        timestamp: s.timestamp,
        verified: s.verified,
        livenessAction: s.liveness_action,
      })),
      count: submissions.length,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
