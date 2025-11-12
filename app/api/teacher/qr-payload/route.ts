import { type NextRequest, NextResponse } from "next/server"
import { generateQRPayload } from "@/lib/crypto"

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 })
    }

    const secret = process.env.HMAC_SECRET || "default-secret-key"
    const payload = await generateQRPayload(sessionId, secret, 10)

    return NextResponse.json(payload)
  } catch (error) {
    console.error("Error generating QR payload:", error)
    return NextResponse.json({ error: "Failed to generate QR payload" }, { status: 500 })
  }
}
