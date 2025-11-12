import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { classId } = await request.json()

    const { error } = await supabase.from("classes").delete().eq("id", classId).eq("teacher_id", user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting class:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete class" },
      { status: 500 },
    )
  }
}
