import { type NextRequest, NextResponse } from "next/server"
import { verifyQRPayload, type QRPayload } from "@/lib/crypto"
import { store } from "@/lib/store"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, sessionId, token, timestamp, selfieImage, livenessAction } = body

    // Validate required fields
    if (!studentId || !sessionId || !token) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Parse and verify the QR payload
    let payload: QRPayload
    try {
      payload = JSON.parse(token)
    } catch (error) {
      return NextResponse.json({ error: "Invalid token format" }, { status: 400 })
    }

    const secret = process.env.HMAC_SECRET || "default-secret-key"
    const isValid = await verifyQRPayload(payload, secret)

    if (!isValid) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    // Check if session exists
    const session = store.getSession(sessionId)
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Add submission
    const submission = {
      studentId,
      sessionId,
      timestamp: timestamp || new Date().toISOString(),
      selfieImage, // Store base64 if provided
      livenessAction,
      verified: isValid,
    }

    const added = store.addSubmission(submission)

    if (!added) {
      return NextResponse.json({ error: "Student already submitted for this session" }, { status: 409 })
    }

    return NextResponse.json({
      success: true,
      message: "Attendance marked successfully",
      submission: {
        studentId,
        timestamp: submission.timestamp,
      },
    })
  } catch (error) {
    console.error("Error submitting attendance:", error)
    return NextResponse.json({ error: "Failed to submit attendance" }, { status: 500 })
  }
}
