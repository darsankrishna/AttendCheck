import { type NextRequest, NextResponse } from "next/server"
import { getSubmissionsByTeacher } from "@/lib/db/submissions"
import { requireAuth } from "@/lib/api/auth"
import { handleApiError, ValidationError } from "@/lib/api/errors"
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

    // Generate CSV
    const headers = ["Student ID", "Timestamp", "Verified", "Liveness Action"]
    const rows = submissions.map((s) => [
      s.student_id,
      s.timestamp,
      s.verified ? "Yes" : "No",
      s.liveness_action || "-",
    ])

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n")

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="attendance-${validatedSessionId}.csv"`,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
