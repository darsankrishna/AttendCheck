import { type NextRequest, NextResponse } from "next/server"
import { store } from "@/lib/store"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 })
    }

    console.log("[v0] Exporting session:", sessionId)
    const session = store.getSession(sessionId)

    if (!session) {
      console.error("[v0] Session not found:", sessionId)
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const csv = store.exportAsCSV(sessionId)
    console.log("[v0] CSV exported successfully, length:", csv.length)

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="attendance-${sessionId}.csv"`,
      },
    })
  } catch (error) {
    console.error("[v0] Error exporting CSV:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to export CSV" },
      { status: 500 },
    )
  }
}
