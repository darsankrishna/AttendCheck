import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { classId, students } = await request.json()

    const studentRecords = students.map((student: any) => ({
      class_id: classId,
      student_id: student.id,
      name: student.name,
      email: student.email,
    }))

    const { error } = await supabase.from("students").insert(studentRecords)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error adding students:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add students" },
      { status: 500 },
    )
  }
}
