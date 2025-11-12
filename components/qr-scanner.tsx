"use client"

import { useEffect, useRef, useState } from "react"
import jsQR from "jsqr"

interface QRScannerProps {
  onScan: (data: string) => void
  isLoading?: boolean
}

export default function QRScanner({ onScan, isLoading }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const hasScannedRef = useRef(false)
  const isMountedRef = useRef(true)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
      stopCamera()
    }
  }, [])

  function scanQRCode() {
    if (!isMountedRef.current || !videoRef.current || !canvasRef.current || hasScannedRef.current) {
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d", { willReadFrequently: true })

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanQRCode)
      return
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Get image data
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

    // Scan for QR code
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    })

    if (code && !hasScannedRef.current) {
      hasScannedRef.current = true
      const scannedText = code.data
      console.log("[QRScanner] ✅ QR detected:", scannedText)
      console.log("[QRScanner] Calling onScan callback with data:", scannedText.substring(0, 50) + "...")

      navigator.vibrate?.(200)

      if (isMountedRef.current) {
        setShowSuccess(true)
        setTimeout(() => {
          if (isMountedRef.current) {
            setShowSuccess(false)
          }
        }, 2000)
      }

      // Stop scanning
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      if (isMountedRef.current) {
        setIsCameraActive(false)
      }
      
      // Call the callback
      try {
        onScan(scannedText)
        console.log("[QRScanner] onScan callback executed successfully")
      } catch (error) {
        console.error("[QRScanner] Error in onScan callback:", error)
      }
      return
    }

    // Continue scanning
    animationFrameRef.current = requestAnimationFrame(scanQRCode)
  }

  async function startCamera() {
    if (!isMountedRef.current || !videoRef.current) return

    console.log("[QRScanner] Starting camera...")
    setError(null)
    setPermissionDenied(false)
    hasScannedRef.current = false
    
    // Reset any existing scanning
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    
    // Stop any existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    try {
      const videoElement = videoRef.current

      if (!isMountedRef.current) return
      setIsCameraActive(true)

      // First try with environment camera, then fallback to other available cameras
      const cameraAttempts: MediaStreamConstraints[] = [
        { video: { facingMode: { exact: "environment" } }, audio: false },
        { video: { facingMode: { ideal: "environment" } }, audio: false },
        { video: true, audio: false },
      ]
      let lastError: unknown = null

      for (const constraints of cameraAttempts) {
        try {
          console.log("[QRScanner] Attempting camera with constraints:", constraints)

          // Get the video stream first
          const stream = await navigator.mediaDevices.getUserMedia(constraints)
          streamRef.current = stream
          
          if (!isMountedRef.current || !videoElement) {
            stream.getTracks().forEach(track => track.stop())
            streamRef.current = null
            return
          }

          // Set the stream to the video element
          videoElement.srcObject = stream
          
          // Wait for video metadata and ensure it's playing
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error("Video loading timeout"))
            }, 10000)
            
            videoElement.onloadedmetadata = () => {
              clearTimeout(timeout)
              videoElement.play()
                .then(() => {
                  // Wait for video to actually start playing with frames
                  const checkPlaying = () => {
                    if (videoElement.readyState >= 2 && !videoElement.paused && videoElement.currentTime > 0) {
                      resolve()
                    } else {
                      setTimeout(checkPlaying, 100)
                    }
                  }
                  checkPlaying()
                })
                .catch(reject)
            }
            
            videoElement.onerror = () => {
              clearTimeout(timeout)
              reject(new Error("Video element error"))
            }
          })

          // Additional wait to ensure video frames are available
          await new Promise(resolve => setTimeout(resolve, 500))

          if (!isMountedRef.current || !videoElement) {
            stream.getTracks().forEach(track => track.stop())
            streamRef.current = null
            return
          }

          console.log("[QRScanner] Starting QR code detection...")
          console.log("[QRScanner] Video element state:", {
            readyState: videoElement.readyState,
            paused: videoElement.paused,
            currentTime: videoElement.currentTime,
            videoWidth: videoElement.videoWidth,
            videoHeight: videoElement.videoHeight,
          })
          
          // Start scanning loop
          scanQRCode()
          
          return // Successfully started, exit retry loop
        } catch (err) {
          lastError = err
          const errorObj = err as { name?: string; message?: string }
          console.warn(
            "[QRScanner] Camera attempt failed:",
            errorObj?.name ?? "UnknownError",
            errorObj?.message,
          )
          // Clean up stream if it exists
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
          }
        }
      }

      if (lastError) {
        throw lastError
      }
    } catch (err: any) {
      if (!isMountedRef.current) return

      console.error("[QRScanner] All camera attempts failed:", err)

      if (err.name === "NotAllowedError" || err.message?.includes("Permission denied")) {
        setPermissionDenied(true)
        setError("Camera permission denied. Please allow access and retry.")
      } else if (err.name === "NotFoundError") {
        setError("No camera found on this device.")
      } else if (err.name === "OverconstrainedError" || err.message?.includes("constraint")) {
        setError("Camera not compatible. Try refreshing the page or using a different browser.")
      } else {
        setError("Failed to start camera: " + (err?.message ?? String(err)))
      }

      setIsCameraActive(false)
    }
  }

  function stopCamera() {
    setIsCameraActive(false)
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  return (
    <div className="space-y-4">
      {error && <div className="text-red-600 text-center">{error}</div>}

      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg text-center">✓ Attendance Marked</div>
        </div>
      )}

      {!isCameraActive ? (
        <button
          onClick={startCamera}
          disabled={permissionDenied || isLoading}
          className="w-full py-3 bg-blue-600 text-white rounded"
        >
          Start Camera
        </button>
      ) : (
        <button onClick={stopCamera} className="w-full py-3 border rounded">
          Stop Camera
        </button>
      )}

      <div
        className="relative w-full bg-black rounded-lg overflow-hidden"
        style={{ aspectRatio: "16/9", minHeight: 240 }}
      >
        {!isCameraActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <p className="text-white/50 text-sm">Camera preview will appear here</p>
          </div>
        )}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ 
            width: "100%", 
            height: "100%", 
            objectFit: "cover",
            opacity: isCameraActive ? 1 : 0,
            transition: "opacity 0.3s",
            zIndex: isCameraActive ? 1 : 0
          }}
        />
        <canvas
          ref={canvasRef}
          className="hidden"
          style={{ display: "none" }}
        />
        {isCameraActive && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div
              style={{
                width: 224,
                height: 224,
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.7)",
              }}
              className="relative border-4 border-white rounded-md"
            />
          </div>
        )}
      </div>
    </div>
  )
}
