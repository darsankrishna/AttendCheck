import { type NextRequest, NextResponse } from "next/server"
import { deleteClass } from "@/lib/db/classes"
import { requireAuth } from "@/lib/api/auth"
import { handleApiError, ValidationError } from "@/lib/api/errors"
import { validateRequired } from "@/lib/api/validation"

export async function DELETE(request: NextRequest) {
  try {
    const { user } = await requireAuth()
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get("classId")

    if (!classId) {
      throw new ValidationError("classId is required")
    }

    await deleteClass(classId, user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
