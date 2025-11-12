"use client"

import { useEffect, useRef, useState } from "react"
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser"

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

  useEffect(() => {
    readerRef.current = new BrowserMultiFormatReader()
    return () => {
      isMountedRef.current = false
    }
  }, [])

  async function startCamera() {
    if (!isMountedRef.current) return

    setError(null)
    setPermissionDenied(false)
    hasScannedRef.current = false

    try {
      const reader = readerRef.current!

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

          decodePromiseRef.current = reader.decodeFromConstraints(
            constraints,
            videoRef.current!,
            (result, err, controls) => {
              if (!isMountedRef.current) {
                controls.stop()
                return
              }

              controlsRef.current = controls

              if (result && !hasScannedRef.current) {
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

                controls.stop()
                controlsRef.current = null
                if (isMountedRef.current) {
                  setIsCameraActive(false)
                }
                onScan(scannedText)
                return
              }

              // Suppress "not found" errors - they're expected during scanning
              if (err && err.name !== "NotFoundException") {
                console.warn("[QRScanner] scan error:", err.name)
              }
            },
          )

          await decodePromiseRef.current
          return // Successfully started, exit retry loop
        } catch (err) {
          lastError = err
          const errorObj = err as { name?: string; message?: string }
          console.warn(
            "[QRScanner] Camera attempt failed:",
            errorObj?.name ?? "UnknownError",
            errorObj?.message,
          )

          // Stop the reader before retrying
          try {
            if (controlsRef.current) {
              controlsRef.current.stop()
              controlsRef.current = null
            }
            // Check if reader has a reset or stopContinuousDecode method before calling
            const readerObj = reader as { reset?: () => void; stopContinuousDecode?: () => Promise<void> };
            if (typeof readerObj.reset === "function") {
              readerObj.reset();
            } else if (typeof readerObj.stopContinuousDecode === "function") {
              readerObj.stopContinuousDecode().catch(() => {});
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
    const reader = readerRef.current as { reset?: () => void; stopContinuousDecode?: () => Promise<void> } | null
    if (reader?.reset) {
      reader.reset()
    } else if (reader?.stopContinuousDecode) {
      reader.stopContinuousDecode().catch(() => {})
    }
    readerRef.current = null
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
          crossOrigin="anonymous"
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
