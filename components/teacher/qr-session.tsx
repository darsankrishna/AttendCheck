"use client"

import { useState, useEffect } from "react"
import { QRDisplay } from "@/components/qr-display"
import { SessionInfo } from "./session-info"
import { AttendanceList } from "./attendance-list"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { StopCircle } from "lucide-react"

interface QRSessionProps {
  sessionId: string
  expiresAt: string
  isActive: boolean
  onStop: () => void
}

export function QRSession({ sessionId, expiresAt, isActive, onStop }: QRSessionProps) {
  const [qrData, setQrData] = useState<string>("")
  const [submissions, setSubmissions] = useState<any[]>([])

  useEffect(() => {
    console.log("[v0] QRSession component mounted, sessionId:", sessionId)
  }, [])

  useEffect(() => {
    console.log("[v0] Starting QR refresh effect for sessionId:", sessionId)

    const generateQR = async () => {
      try {
        console.log("[v0] Generating QR for sessionId:", sessionId)
        const response = await fetch("/api/teacher/qr-payload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        })
        if (!response.ok) {
          console.error("[v0] QR generation failed:", response.status, response.statusText)
          throw new Error("Failed to generate QR code")
        }
        const data = await response.json()
        console.log("[v0] QR payload received:", data)
        const qrString = JSON.stringify(data)
        setQrData(qrString)
        console.log("[v0] QR data updated")
      } catch (error) {
        console.error("[v0] Failed to generate QR:", error)
      }
    }

    generateQR()
    const interval = setInterval(generateQR, 6000)
    return () => clearInterval(interval)
  }, [sessionId])

  // Poll for submissions
  useEffect(() => {
    if (!isActive) return

    const pollSubmissions = async () => {
      try {
        const response = await fetch(`/api/teacher/submissions?sessionId=${sessionId}`)
        if (!response.ok) {
          console.error("[v0] Submissions fetch failed:", response.status)
          return
        }
        const data = await response.json()
        setSubmissions(data.submissions || [])
      } catch (error) {
        console.error("Failed to fetch submissions:", error)
      }
    }

    pollSubmissions()
    const interval = setInterval(pollSubmissions, 1000)
    return () => clearInterval(interval)
  }, [sessionId, isActive])

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/teacher/export?sessionId=${sessionId}`)

      if (!response.ok) {
        let errorMessage = response.statusText
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // If response isn't JSON, use statusText
        }
        console.error("[v0] Export failed:", errorMessage)
        alert(`Export failed: ${errorMessage}`)
        return
      }

      const csv = await response.text()
      console.log("[v0] CSV received, length:", csv.length)

      const blob = new Blob([csv], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `attendance-${sessionId}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("[v0] Failed to export CSV:", error)
      alert("Failed to export CSV")
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-card to-input border-border p-6">
        <div className="text-center space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Active QR Code</p>
            <h2 className="text-2xl font-bold text-foreground">{isActive ? "Session Running" : "Session Stopped"}</h2>
          </div>

          <div className="flex justify-center">
            <div className="relative">
              <QRDisplay data={qrData} size={280} />
            </div>
          </div>

          <div className="flex gap-2 justify-center">
            <Button onClick={onStop} disabled={!isActive} variant="destructive">
              <StopCircle className="w-4 h-4 mr-2" />
              Stop Session
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <SessionInfo
            sessionId={sessionId}
            expiresAt={expiresAt}
            onExport={handleExport}
            submissionCount={submissions.length}
          />
        </div>
        <div className="lg:col-span-2">
          <div className="space-y-2 mb-2">
            <h3 className="text-sm font-semibold text-foreground">Recent Submissions</h3>
          </div>
          <AttendanceList submissions={submissions} />
        </div>
      </div>
    </div>
  )
}
