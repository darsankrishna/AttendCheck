"use client"

import { useEffect, useRef } from "react"
import QRCode from "qrcode"

interface QRDisplayProps {
  data: string
  size?: number
}

export function QRDisplay({ data, size = 300 }: QRDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !data) return

    QRCode.toCanvas(canvasRef.current, data, {
      width: size,
      margin: 2,
      color: {
        dark: "#ffffff",
        light: "#0f172a",
      },
      errorCorrectionLevel: "H",
    })
  }, [data, size])

  return (
    <canvas
      ref={canvasRef}
      className="rounded-lg border-2 border-border bg-card"
      style={{ width: size, height: size }}
    />
  )
}
