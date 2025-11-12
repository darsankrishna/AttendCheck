"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle } from "lucide-react"
import QRScanner from "@/components/qr-scanner"
import { LivenessDetector } from "@/components/liveness-detector"

interface SubmissionFormProps {
  sessionId?: string
  onSuccess?: () => void
}

export function SubmissionForm({ sessionId, onSuccess }: SubmissionFormProps) {
  const [studentId, setStudentId] = useState("")
  const [scannedData, setScannedData] = useState("")
  const [selfieImage, setSelfieImage] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [stage, setStage] = useState<"qr-scan" | "liveness" | "submit">("qr-scan")

  const handleQRScan = (data: string) => {
    console.log("[SubmissionForm] QR scanned, data received:", data.substring(0, 50) + "...")
    setScannedData(data)
    setStage("liveness")
    console.log("[SubmissionForm] Stage changed to liveness")
  }

  const handleLivenessVerify = (imageData: string) => {
    setSelfieImage(imageData)
    setStage("submit")
  }

  const submitAttendance = async () => {
    console.log("[SubmissionForm] Submit button clicked")
    
    if (!studentId.trim()) {
      console.log("[SubmissionForm] Validation failed: Student ID missing")
      setStatus("error")
      setMessage("Please enter your student ID")
      return
    }

    if (!scannedData) {
      console.log("[SubmissionForm] Validation failed: Scanned data missing")
      setStatus("error")
      setMessage("Please scan the QR code")
      return
    }

    if (!selfieImage) {
      console.log("[SubmissionForm] Validation failed: Selfie image missing")
      setStatus("error")
      setMessage("Please complete liveness verification")
      return
    }

    console.log("[SubmissionForm] All validations passed, submitting...")
    setIsSubmitting(true)
    setStatus("idle")
    setMessage("")

    try {
      // Parse the scanned QR data to extract sessionId
      let qrPayload: { sid?: string }
      try {
        qrPayload = JSON.parse(scannedData)
        console.log("[SubmissionForm] Parsed QR payload:", { sid: qrPayload.sid })
      } catch (parseError) {
        console.error("[SubmissionForm] Failed to parse QR data:", parseError)
        setStatus("error")
        setMessage("Invalid QR code format. Please scan again.")
        setIsSubmitting(false)
        return
      }

      if (!qrPayload.sid) {
        console.error("[SubmissionForm] QR payload missing session ID")
        setStatus("error")
        setMessage("QR code missing session ID. Please scan again.")
        setIsSubmitting(false)
        return
      }
      
      const payload = {
        studentId,
        sessionId: qrPayload.sid,
        token: scannedData, // The full JSON string as token
        selfieImage,
        timestamp: new Date().toISOString(),
      }
      
      console.log("[SubmissionForm] Submitting attendance:", {
        studentId,
        sessionId: qrPayload.sid,
        hasToken: !!scannedData,
        hasSelfie: !!selfieImage,
        timestamp: payload.timestamp
      })
      
      const response = await fetch("/api/attendance/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      console.log("[SubmissionForm] Response status:", response.status, response.statusText)
      const result = await response.json()
      console.log("[SubmissionForm] Response data:", result)

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit attendance")
      }

      console.log("[SubmissionForm] ✅ Attendance submitted successfully!")
      setStatus("success")
      setMessage("Attendance marked successfully!")
      setStudentId("")
      setScannedData("")
      setSelfieImage("")
      setStage("qr-scan")

      setTimeout(() => {
        onSuccess?.()
      }, 2000)
    } catch (error) {
      console.error("[SubmissionForm] Error submitting attendance:", error)
      setStatus("error")
      setMessage(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="bg-card border-border p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Mark Attendance</h2>
        <p className="text-muted-foreground">
          Scan the QR code, complete liveness verification, and enter your student ID
        </p>
      </div>

      {status === "success" && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-900">Success</AlertTitle>
          <AlertDescription className="text-green-800">{message}</AlertDescription>
        </Alert>
      )}

      {status === "error" && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {/* Student ID input - always visible */}
      <div className="space-y-2">
        <label htmlFor="studentId" className="block text-sm font-medium text-foreground">
          Student ID {stage !== "qr-scan" && <span className="text-muted-foreground">(required)</span>}
        </label>
        <input
          id="studentId"
          type="text"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          placeholder="Enter your student ID"
          className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={isSubmitting || stage === "submit"}
        />
      </div>

      {stage === "qr-scan" && (
        <QRScanner onScan={handleQRScan} isLoading={isSubmitting} />
      )}

      {stage === "liveness" && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              ✓ QR Code scanned successfully! Now complete liveness verification.
            </p>
          </div>
          <LivenessDetector onVerify={handleLivenessVerify} isLoading={isSubmitting} />
        </div>
      )}

      {stage === "submit" && (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-3">Ready to submit:</p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                <span className={studentId.trim() ? "text-green-900 dark:text-green-100" : "text-red-600 dark:text-red-400"}>
                  Student ID: {studentId.trim() || "Not entered"}
                </span>
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                <span className="text-green-900 dark:text-green-100">QR Code scanned</span>
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                <span className="text-green-900 dark:text-green-100">Liveness verified</span>
              </li>
            </ul>
            {!studentId.trim() && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                Please enter your Student ID above before submitting.
              </p>
            )}
          </div>

          <Button
            onClick={submitAttendance}
            disabled={isSubmitting}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
            size="lg"
          >
            {isSubmitting ? "Submitting..." : "Submit Attendance"}
          </Button>

          <Button
            onClick={() => setStage("qr-scan")}
            variant="outline"
            className="w-full h-12"
            size="lg"
            disabled={isSubmitting}
          >
            Start Over
          </Button>
        </div>
      )}
    </Card>
  )
}
