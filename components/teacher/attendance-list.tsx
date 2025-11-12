"use client"

import { Card } from "@/components/ui/card"
import { CheckCircle, AlertCircle } from "lucide-react"

interface Submission {
  studentId: string
  timestamp: string
  verified: boolean
  livenessAction?: string
}

interface AttendanceListProps {
  submissions: Submission[]
}

export function AttendanceList({ submissions }: AttendanceListProps) {
  if (submissions.length === 0) {
    return (
      <Card className="bg-card border-border p-6 text-center">
        <p className="text-muted-foreground">Waiting for student submissions...</p>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border overflow-hidden">
      <div className="divide-y divide-border">
        {submissions.map((submission) => (
          <div
            key={`${submission.studentId}-${submission.timestamp}`}
            className="p-4 hover:bg-input/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-mono text-sm text-foreground truncate">{submission.studentId}</p>
                  {submission.verified ? (
                    <CheckCircle className="w-4 h-4 text-accent flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{new Date(submission.timestamp).toLocaleTimeString()}</p>
              </div>
              {submission.livenessAction && (
                <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                  {submission.livenessAction}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
