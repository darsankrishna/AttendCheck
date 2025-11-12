import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { data: classes, error } = await supabase
      .from("classes")
      .select(`
        id,
        name,
        created_at,
        students (
          id,
          student_id,
          name,
          email
        )
      `)
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    const formattedClasses =
      classes?.map((cls: any) => ({
        id: cls.id,
        name: cls.name,
        students: cls.students.map((s: any) => ({
          id: s.student_id,
          name: s.name,
          email: s.email,
        })),
      })) || []

    console.log("[v0] Returning formatted classes:", formattedClasses)
    return NextResponse.json(formattedClasses)
  } catch (error) {
    console.error("Error listing classes:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list classes" },
      { status: 500 },
    )
  }
}
