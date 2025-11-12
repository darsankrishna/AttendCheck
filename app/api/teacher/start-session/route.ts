import { type NextRequest, NextResponse } from "next/server"
import { generateSessionId } from "@/lib/crypto"
import { store } from "@/lib/store"

export async function POST(request: NextRequest) {
  try {
    const sessionId = generateSessionId()
    const expiryTime = 600 // 10 minutes for the session

    const session = store.createSession(sessionId, expiryTime)

    return NextResponse.json({
      sessionId: session.id,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
    })
  } catch (error) {
    console.error("Error starting session:", error)
    return NextResponse.json({ error: "Failed to start session" }, { status: 500 })
  }
}
