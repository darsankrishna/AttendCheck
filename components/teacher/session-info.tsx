"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Clock, Copy, CheckCircle } from "lucide-react"

interface SessionInfoProps {
  sessionId: string
  expiresAt: string
  onExport: () => void
  submissionCount: number
}

export function SessionInfo({ sessionId, expiresAt, onExport, submissionCount }: SessionInfoProps) {
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const updateTime = () => {
      const remaining = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
      setTimeRemaining(remaining)
    }
    
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

  useEffect(() => {
    console.log("[SessionInfo] Submission count updated:", submissionCount)
  }, [submissionCount])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sessionId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`

  return (
    <Card className="bg-card border-border p-5">
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Session ID</h3>
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2.5 border border-border">
            <code className="text-sm text-foreground font-mono flex-1 truncate">{sessionId}</code>
            <button 
              onClick={handleCopy} 
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-background"
              title="Copy session ID"
            >
              {copied ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/30 rounded-lg p-3 border border-border">
            <p className="text-xs text-muted-foreground mb-1.5">Time Remaining</p>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <p className="text-xl font-bold text-foreground">{timeString}</p>
            </div>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 border border-border">
            <p className="text-xs text-muted-foreground mb-1.5">Submissions</p>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{submissionCount}</p>
          </div>
        </div>

        <Button 
          onClick={onExport} 
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          size="lg"
        >
          Export CSV
        </Button>
      </div>
    </Card>
  )
}
