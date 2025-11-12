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

    const { className, students } = await request.json()

    // Create class
    const { data: classData, error: classError } = await supabase
      .from("classes")
      .insert({
        name: className,
        teacher_id: user.id,
      })
      .select()
      .single()

    if (classError) throw classError

    // Add students to class
    if (students.length > 0) {
      const studentRecords = students.map((student: any) => ({
        class_id: classData.id,
        student_id: student.id,
        name: student.name,
        email: student.email,
      }))

      const { error: studentsError } = await supabase.from("students").insert(studentRecords)

      if (studentsError) throw studentsError
    }

    return NextResponse.json({
      id: classData.id,
      name: classData.name,
      students,
    })
  } catch (error) {
    console.error("Error creating class:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create class" },
      { status: 500 },
    )
  }
}
