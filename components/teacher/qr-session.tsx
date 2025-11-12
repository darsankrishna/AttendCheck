"use client"

import { useState, useEffect } from "react"
import { QRDisplay } from "@/components/qr-display"
import { SessionInfo } from "./session-info"
import { AttendanceList } from "./attendance-list"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { StopCircle, Users, Clock, Download, QrCode } from "lucide-react"

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
    if (!isActive) {
      console.log("[QRSession] Polling disabled - session not active")
      return
    }

    const pollSubmissions = async () => {
      try {
        console.log("[QRSession] Polling submissions for sessionId:", sessionId)
        const response = await fetch(`/api/teacher/submissions?sessionId=${sessionId}`)
        if (!response.ok) {
          console.error("[QRSession] Submissions fetch failed:", response.status)
          return
        }
        const data = await response.json()
        console.log("[QRSession] Submissions received:", {
          count: data.count,
          submissionsLength: data.submissions?.length || 0,
          submissions: data.submissions
        })
        setSubmissions(prev => {
          const newSubmissions = data.submissions || []
          if (newSubmissions.length !== prev.length) {
            console.log("[QRSession] Submissions count changed:", prev.length, "->", newSubmissions.length)
          }
          return newSubmissions
        })
      } catch (error) {
        console.error("[QRSession] Failed to fetch submissions:", error)
      }
    }

    console.log("[QRSession] Starting submission polling for sessionId:", sessionId)
    pollSubmissions()
    const interval = setInterval(pollSubmissions, 1000)
    return () => {
      console.log("[QRSession] Stopping submission polling")
      clearInterval(interval)
    }
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

  const timeRemaining = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Submissions</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{submissions.length}</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-full">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Time Remaining</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {minutes}:{seconds.toString().padStart(2, '0')}
              </p>
            </div>
            <div className="p-3 bg-orange-500/10 rounded-full">
              <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Session Status</p>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                {isActive ? "Active" : "Stopped"}
              </p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-full">
              <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* QR Code Section */}
        <div className="lg:col-span-1">
          <Card className="bg-gradient-to-br from-card via-card to-muted/30 border-border p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">QR Code</h3>
                </div>
                {isActive && (
                  <span className="px-2 py-1 text-xs font-medium bg-green-500/20 text-green-700 dark:text-green-400 rounded-full">
                    Live
                  </span>
                )}
              </div>

              <div className="flex justify-center bg-white dark:bg-black rounded-lg p-4 border-2 border-dashed border-border">
                <QRDisplay data={qrData} size={240} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Session ID</span>
                  <code className="text-xs font-mono bg-muted px-2 py-1 rounded">{sessionId}</code>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Students should scan this QR code to mark attendance
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={onStop} 
                  disabled={!isActive} 
                  variant="destructive"
                  className="flex-1"
                >
                  <StopCircle className="w-4 h-4 mr-2" />
                  Stop Session
                </Button>
                <Button 
                  onClick={handleExport}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Submissions List */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Student Submissions
                </h3>
                <span className="text-sm text-muted-foreground">
                  {submissions.length} {submissions.length === 1 ? 'student' : 'students'}
                </span>
              </div>
            </div>
            <AttendanceList submissions={submissions} />
          </Card>
        </div>
      </div>
    </div>
  )
}
