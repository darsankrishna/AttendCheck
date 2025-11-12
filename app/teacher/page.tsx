import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { TeacherPageClient } from "@/components/teacher/teacher-page-client"

export default async function TeacherPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return <TeacherPageClient />
}
