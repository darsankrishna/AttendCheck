"use client"

import { Card } from "@/components/ui/card"
import { CheckCircle, AlertCircle, Clock } from "lucide-react"

interface Submission {
  studentId: string
  studentName?: string
  studentEmail?: string
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
      <div className="p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <Clock className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-lg mb-1">Waiting for submissions</p>
        <p className="text-sm text-muted-foreground">Students will appear here once they scan the QR code</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
      {submissions.map((submission, index) => (
        <div
          key={`${submission.studentId}-${submission.timestamp}`}
          className="p-4 hover:bg-muted/50 transition-colors animate-in fade-in slide-in-from-right"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={`mt-0.5 p-1.5 rounded-full ${
                submission.verified 
                  ? 'bg-green-500/20' 
                  : 'bg-red-500/20'
              }`}>
                {submission.verified ? (
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-foreground truncate">
                    {submission.studentName || submission.studentId}
                  </p>
                  {submission.studentName && (
                    <span className="text-xs text-muted-foreground font-mono">
                      ({submission.studentId})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{new Date(submission.timestamp).toLocaleTimeString()}</span>
                  {submission.studentEmail && (
                    <span className="truncate max-w-[150px]">{submission.studentEmail}</span>
                  )}
                  {submission.livenessAction && (
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                      {submission.livenessAction}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground whitespace-nowrap">
              {new Date(submission.timestamp).toLocaleDateString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
