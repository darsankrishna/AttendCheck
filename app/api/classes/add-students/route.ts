import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api/auth"
import { handleApiError, ValidationError } from "@/lib/api/errors"
import { validateRequired, validateString } from "@/lib/api/validation"

export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth()
    const body = await request.json()
    const { classId, students } = body

    validateRequired(body, ["classId", "students"])

    if (!Array.isArray(students) || students.length === 0) {
      throw new ValidationError("Students must be a non-empty array")
    }

    // Verify class belongs to teacher
    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("id")
      .eq("id", classId)
      .eq("teacher_id", user.id)
      .single()

    if (classError || !classData) {
      throw new ValidationError("Class not found or access denied")
    }

    // Validate and format students
    const studentRecords = students.map((student: any, index: number) => {
      if (!student.id || !student.name) {
        throw new ValidationError(`Student at index ${index} is missing required fields (id, name)`)
      }
      return {
        class_id: classId,
        student_id: validateString(student.id, `Student ${index} ID`, 100),
        name: validateString(student.name, `Student ${index} name`, 200),
        email: student.email ? validateString(student.email, `Student ${index} email`, 200) : undefined,
      }
    })

    const { error: studentsError } = await supabase
      .from("students")
      .insert(studentRecords)

    if (studentsError) {
      throw new ValidationError(`Failed to add students: ${studentsError.message}`)
    }

    return NextResponse.json({ success: true, count: studentRecords.length })
  } catch (error) {
    return handleApiError(error)
  }
}
