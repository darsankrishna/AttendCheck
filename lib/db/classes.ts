import { createClient } from "@/lib/supabase/server"

export interface Student {
  id: string
  name: string
  email?: string
}

export interface Class {
  id: string
  name: string
  students: Student[]
  created_at: string
}

export async function getClasses(teacherId: string): Promise<Class[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
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
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to get classes: ${error.message}`)
  }

  return (
    data?.map((cls: any) => ({
      id: cls.id,
      name: cls.name,
      created_at: cls.created_at,
      students: cls.students?.map((s: any) => ({
        id: s.student_id,
        name: s.name,
        email: s.email,
      })) || [],
    })) || []
  )
}

export async function createClass(
  teacherId: string,
  className: string,
  students: Student[]
): Promise<Class> {
  const supabase = await createClient()

  // Create class
  const { data: classData, error: classError } = await supabase
    .from("classes")
    .insert({
      name: className,
      teacher_id: teacherId,
    })
    .select()
    .single()

  if (classError) {
    throw new Error(`Failed to create class: ${classError.message}`)
  }

  // Add students
  if (students.length > 0) {
    const studentRecords = students.map((student) => ({
      class_id: classData.id,
      student_id: student.id,
      name: student.name,
      email: student.email,
    }))

    const { error: studentsError } = await supabase
      .from("students")
      .insert(studentRecords)

    if (studentsError) {
      // Rollback: delete the class
      await supabase.from("classes").delete().eq("id", classData.id)
      throw new Error(`Failed to add students: ${studentsError.message}`)
    }
  }

  return {
    id: classData.id,
    name: classData.name,
    created_at: classData.created_at,
    students,
  }
}

export async function deleteClass(classId: string, teacherId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("classes")
    .delete()
    .eq("id", classId)
    .eq("teacher_id", teacherId)

  if (error) {
    throw new Error(`Failed to delete class: ${error.message}`)
  }
}

