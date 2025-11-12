import { type NextRequest, NextResponse } from "next/server"
import { createClass } from "@/lib/db/classes"
import { requireAuth } from "@/lib/api/auth"
import { handleApiError, ValidationError } from "@/lib/api/errors"
import { validateRequired, validateString } from "@/lib/api/validation"

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth()
    const body = await request.json()
    const { className, students } = body

    validateRequired(body, ["className"])
    
    const validatedClassName = validateString(className, "Class name", 200)
    
    // Validate students array
    if (!Array.isArray(students)) {
      throw new ValidationError("Students must be an array")
    }

    const validatedStudents = students.map((student: any, index: number) => {
      if (!student.id || !student.name) {
        throw new ValidationError(`Student at index ${index} is missing required fields (id, name)`)
      }
      return {
        id: validateString(student.id, `Student ${index} ID`, 100),
        name: validateString(student.name, `Student ${index} name`, 200),
        email: student.email ? validateString(student.email, `Student ${index} email`, 200) : undefined,
      }
    })

    const classData = await createClass(user.id, validatedClassName, validatedStudents)

    return NextResponse.json({
      id: classData.id,
      name: classData.name,
      students: classData.students,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
