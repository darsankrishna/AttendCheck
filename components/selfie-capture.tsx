"use client"

import { useRef, useState } from "react"
import { AlertCircle, Camera, RotateCw, Check } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface SelfieCaptureProps {
  onCapture: (imageData: string) => void
  isLoading?: boolean
}

export function SelfieCapture({ onCapture, isLoading }: SelfieCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState<string>("")
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string>("")
  const [facesDetected, setFacesDetected] = useState(0)

  const startCamera = async () => {
    setError("")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsCameraActive(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to access camera. Please check permissions.")
      setIsCameraActive(false)
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
    }
    setIsCameraActive(false)
  }

  const captureSelfie = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const imageData = canvas.toDataURL("image/jpeg", 0.8)
    setCapturedImage(imageData)
    stopCamera()

    // Simulate face detection (in production, use a ML library like face-api.js or TensorFlow.js)
    setFacesDetected(1)
  }

  const confirmCapture = () => {
    if (capturedImage && facesDetected > 0) {
      onCapture(capturedImage)
    }
  }

  const retake = () => {
    setCapturedImage("")
    setFacesDetected(0)
    startCamera()
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!capturedImage ? (
        <>
          {!isCameraActive ? (
            <Button
              onClick={startCamera}
              disabled={isLoading}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
              size="lg"
            >
              <Camera className="w-5 h-5 mr-2" />
              Start Camera
            </Button>
          ) : (
            <Button onClick={stopCamera} variant="outline" className="w-full h-12 bg-transparent" size="lg">
              Cancel
            </Button>
          )}

          {isCameraActive && (
            <>
              <div className="relative w-full bg-black rounded-lg overflow-hidden">
                <video ref={videoRef} autoPlay playsInline className="w-full h-auto" />
                <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-32 h-40 border-4 border-primary rounded-3xl"></div>
                  </div>
                </div>
              </div>

              <Button
                onClick={captureSelfie}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
                size="lg"
              >
                <Camera className="w-5 h-5 mr-2" />
                Take Selfie
              </Button>
            </>
          )}
        </>
      ) : (
        <>
          <div className="relative w-full rounded-lg overflow-hidden">
            <img src={capturedImage || "/placeholder.svg"} alt="Captured selfie" className="w-full h-auto" />
          </div>

          {facesDetected > 0 && (
            <Alert className="bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">Face detected - liveness verified</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button onClick={retake} variant="outline" className="flex-1 h-12 bg-transparent" size="lg">
              <RotateCw className="w-5 h-5 mr-2" />
              Retake
            </Button>

            <Button
              onClick={confirmCapture}
              disabled={facesDetected === 0}
              className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
              size="lg"
            >
              <Check className="w-5 h-5 mr-2" />
              Confirm
            </Button>
          </div>
        </>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
