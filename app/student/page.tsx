"use client"

import { useState } from "react"
import { SubmissionForm } from "@/components/student/submission-form"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"

export default function StudentPage() {
  // Service worker is optional for core functionality

  const [resetKey, setResetKey] = useState(0)

  const handleSuccess = () => {
    setResetKey((prev) => prev + 1)
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">Student Attendance</h1>
          <p className="text-lg text-muted-foreground">Scan the QR code displayed in class to mark your attendance</p>
        </header>

        <SubmissionForm key={resetKey} onSuccess={handleSuccess} />
      </div>
      <PWAInstallPrompt />
    </main>
  )
}
