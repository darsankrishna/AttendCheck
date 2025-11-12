"use client"

import { useState } from "react"
import { ClassSelector } from "@/components/teacher/class-selector"
import { ClassCreator } from "@/components/teacher/class-creator"
import { QRSession } from "@/components/teacher/qr-session"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"
import type { Student } from "@/lib/store"
import { LogoutButton } from "@/components/logout-button"

export function TeacherPageClient() {
  const [sessionId, setSessionId] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const [isActive, setIsActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [view, setView] = useState<"selector" | "creator" | "session">("selector")
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)

  const handleStartSession = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/teacher/start-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: selectedClassId,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to start session")
      }
      setSessionId(data.sessionId)
      setExpiresAt(data.expiresAt)
      setIsActive(true)
      setView("session")
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStopSession = () => {
    setIsActive(false)
    setSessionId("")
    setExpiresAt("")
    setView("selector")
    setSelectedStudents([])
    setSelectedClassId(null)
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-12 text-center flex flex-col items-center gap-4">
          <div className="flex items-center justify-between w-full">
            <div></div>
            <LogoutButton />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Teacher Dashboard</h1>
          <p className="text-lg text-muted-foreground">
            {isActive
              ? "Session Active - Share your screen with students"
              : "Select a class or create a new one to start"}
          </p>
        </header>

        {view === "selector" && !isActive && (
          <div className="space-y-6">
            <ClassSelector
              onClassSelected={(classId, students) => {
                setSelectedClassId(classId)
                setSelectedStudents(students)
              }}
              onCreateNew={() => setView("creator")}
            />
            {selectedStudents.length > 0 && (
              <button
                onClick={handleStartSession}
                disabled={isLoading}
                className="w-full px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors text-lg"
              >
                {isLoading ? "Starting Session..." : `Start Session (${selectedStudents.length} students)`}
              </button>
            )}
          </div>
        )}

        {view === "creator" && !isActive && (
          <ClassCreator onClassCreated={() => setView("selector")} onCancel={() => setView("selector")} />
        )}

        {view === "session" && isActive && (
          <QRSession sessionId={sessionId} expiresAt={expiresAt} isActive={isActive} onStop={handleStopSession} />
        )}
      </div>
      <PWAInstallPrompt />
    </main>
  )
}
