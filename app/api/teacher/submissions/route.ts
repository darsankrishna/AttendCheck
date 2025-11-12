import { type NextRequest, NextResponse } from "next/server"
import { store } from "@/lib/store"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 })
    }

    const submissions = store.getSubmissions(sessionId)

    return NextResponse.json({
      sessionId,
      submissions: submissions.map((s) => ({
        studentId: s.studentId,
        timestamp: s.timestamp,
        verified: s.verified,
        livenessAction: s.livenessAction,
      })),
      count: submissions.length,
    })
  } catch (error) {
    console.error("Error fetching submissions:", error)
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 })
  }
}
