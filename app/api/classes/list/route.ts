import { NextResponse } from "next/server"
import { getClasses } from "@/lib/db/classes"
import { requireAuth } from "@/lib/api/auth"
import { handleApiError } from "@/lib/api/errors"

export async function GET() {
  try {
    const { user } = await requireAuth()

    const classes = await getClasses(user.id)

    return NextResponse.json(classes)
  } catch (error) {
    return handleApiError(error)
  }
}
