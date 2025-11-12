"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Clock, Copy } from "lucide-react"

interface SessionInfoProps {
  sessionId: string
  expiresAt: string
  onExport: () => void
  submissionCount: number
}

export function SessionInfo({ sessionId, expiresAt, onExport, submissionCount }: SessionInfoProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(sessionId)
  }

  const timeRemaining = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))

  return (
    <Card className="bg-card border-border p-4">
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Session ID</h3>
          <div className="flex items-center justify-between bg-input rounded px-3 py-2">
            <code className="text-sm text-foreground font-mono">{sessionId}</code>
            <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground transition-colors">
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Time Remaining</p>
            <div className="flex items-center gap-2 text-lg font-semibold text-primary">
              <Clock className="w-5 h-5" />
              {timeRemaining}s
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Submissions</p>
            <p className="text-lg font-semibold text-accent">{submissionCount}</p>
          </div>
        </div>

        <Button onClick={onExport} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          Export CSV
        </Button>
      </div>
    </Card>
  )
}
