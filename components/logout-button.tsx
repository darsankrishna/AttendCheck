"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { LogOut } from "lucide-react"

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setIsLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <Button onClick={handleLogout} disabled={isLoading} variant="outline" size="sm" className="gap-2 bg-transparent">
      <LogOut className="w-4 h-4" />
      {isLoading ? "Logging out..." : "Logout"}
    </Button>
  )
}
