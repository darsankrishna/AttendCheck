"use client"

import { useEffect, useRef, useState } from "react"
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser"
import { DecodeHintType, BarcodeFormat } from "@zxing/library"

interface QRScannerProps {
  onScan: (data: string) => void
  isLoading?: boolean
}

export default function QRScanner({ onScan, isLoading }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const hasScannedRef = useRef(false)
  const isMountedRef = useRef(true)
  const decodePromiseRef = useRef<Promise<unknown> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)


  useEffect(() => {
    const reader = new BrowserMultiFormatReader()
    // Configure hints for better QR code detection
    const hints = new Map()
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE])
    hints.set(DecodeHintType.TRY_HARDER, true)
    reader.hints = hints
    readerRef.current = reader
    return () => {
      isMountedRef.current = false
    }
  }, [])

  async function startCamera() {
    if (!isMountedRef.current || !videoRef.current) return

    setError(null)
    setPermissionDenied(false)
    hasScannedRef.current = false
    
    // Reset any existing controls
    if (controlsRef.current) {
      try {
        controlsRef.current.stop()
      } catch (e) {
        console.warn("[QRScanner] Error stopping previous controls:", e)
      }
      controlsRef.current = null
    }

    try {
      const reader = readerRef.current!
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
          await new Promise(resolve => setTimeout(resolve, 1000))

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
          
          // Use decodeFromVideoElement for continuous scanning
          const controls = await reader.decodeFromVideoElement(
            videoElement,
            (result, err) => {
              console.log("[QRScanner] Callback called:", { hasResult: !!result, hasError: !!err })
              
              if (!isMountedRef.current) {
                if (controls) {
                  controls.stop().catch(() => {})
                }
                return
              }

              // Handle error first
              if (err) {
                // Suppress "not found" errors - they're expected during scanning
                if (err.name !== "NotFoundException") {
                  console.warn("[QRScanner] scan error:", err.name, err.message)
                }
                return
              }

              // Handle successful result
              if (result && !hasScannedRef.current) {
                try {
                  hasScannedRef.current = true
                  const scannedText = result.getText()
                  console.log("[QRScanner] ✅ QR detected:", scannedText)

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
                  if (controls) {
                    controls.stop().catch(() => {})
                  }
                  if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop())
                    streamRef.current = null
                  }
                  controlsRef.current = null
                  if (isMountedRef.current) {
                    setIsCameraActive(false)
                  }
                  onScan(scannedText)
                } catch (e) {
                  console.error("[QRScanner] Error processing scan result:", e)
                  hasScannedRef.current = false // Reset to allow retry
                }
                return
              }
            },
          )
          
          console.log("[QRScanner] Decoder started, controls:", controls)

          controlsRef.current = controls
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
          // Stop the reader before retrying
          try {
            if (controlsRef.current) {
              controlsRef.current.stop()
              controlsRef.current = null
            }
            // Check if reader has a reset or stopContinuousDecode method before calling
            const readerObj = reader as { reset?: () => void; stopContinuousDecode?: () => Promise<void> }
            if (typeof readerObj.reset === "function") {
              readerObj.reset()
            } else if (typeof readerObj.stopContinuousDecode === "function") {
              readerObj.stopContinuousDecode().catch(() => {})
            }
          } catch {}
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
    if (controlsRef.current) {
      controlsRef.current.stop()
      controlsRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    const reader = readerRef.current as { reset?: () => void; stopContinuousDecode?: () => Promise<void> } | null
    if (reader?.reset) {
      reader.reset()
    } else if (reader?.stopContinuousDecode) {
      reader.stopContinuousDecode().catch(() => {})
    }
    decodePromiseRef.current = null
  }

  useEffect(() => {
    return () => {
      isMountedRef.current = false
      stopCamera()
    }
  }, [])

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
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isCameraActive ? "opacity-100" : "opacity-0"
          }`}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
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
