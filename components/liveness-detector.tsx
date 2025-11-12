"use client"

import { useState } from "react"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SelfieCapture } from "./selfie-capture"

interface LivenessDetectorProps {
  onVerify: (selfieImage: string) => void
  isLoading?: boolean
}

export function LivenessDetector({ onVerify, isLoading }: LivenessDetectorProps) {
  const [detectionStatus, setDetectionStatus] = useState<"idle" | "detecting" | "verified" | "failed">("idle")
  const [error, setError] = useState<string>("")

  const handleCapture = async (imageData: string) => {
    setDetectionStatus("detecting")
    setError("")

    try {
      // In production, send to backend for advanced liveness detection
      // For now, simulate basic validation
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setDetectionStatus("verified")
      onVerify(imageData)
    } catch (err) {
      setDetectionStatus("failed")
      setError(err instanceof Error ? err.message : "Liveness detection failed")
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {detectionStatus === "detecting" && (
        <Alert className="bg-blue-50 border-blue-200">
          <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
          <AlertDescription className="text-blue-800">Verifying liveness... Please hold still</AlertDescription>
        </Alert>
      )}

      {detectionStatus !== "verified" && (
        <SelfieCapture onCapture={handleCapture} isLoading={isLoading || detectionStatus === "detecting"} />
      )}
    </div>
  )
}
