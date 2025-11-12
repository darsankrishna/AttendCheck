"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export interface Student {
  id: string
  name: string
  email?: string
}

interface StudentRosterProps {
  onStudentsAdded?: (students: Student[]) => void
}

export function StudentRoster({ onStudentsAdded }: StudentRosterProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [studentId, setStudentId] = useState("")
  const [studentName, setStudentName] = useState("")
  const [studentEmail, setStudentEmail] = useState("")
  const [csvText, setCsvText] = useState("")
  const [mode, setMode] = useState<"manual" | "csv">("manual")

  const addStudent = () => {
    if (!studentId.trim() || !studentName.trim()) {
      alert("Please enter both Student ID and Name")
      return
    }

    if (students.find((s) => s.id === studentId)) {
      alert("Student ID already exists")
      return
    }

    const newStudents = [...students, { id: studentId, name: studentName, email: studentEmail || undefined }]
    setStudents(newStudents)
    onStudentsAdded?.(newStudents)
    setStudentId("")
    setStudentName("")
    setStudentEmail("")
  }

  const removeStudent = (id: string) => {
    const newStudents = students.filter((s) => s.id !== id)
    setStudents(newStudents)
    onStudentsAdded?.(newStudents)
  }

  const importFromCSV = () => {
    try {
      const lines = csvText.trim().split("\n")
      const newStudents: Student[] = []

      for (const line of lines) {
        if (!line.trim()) continue
        const [id, name, email] = line.split(",").map((s) => s.trim())
        if (id && name) {
          if (!newStudents.find((s) => s.id === id) && !students.find((s) => s.id === id)) {
            newStudents.push({ id, name, email: email || undefined })
          }
        }
      }

      const combined = [...students, ...newStudents]
      setStudents(combined)
      onStudentsAdded?.(combined)
      setCsvText("")
      setMode("manual")
      alert(`Added ${newStudents.length} students`)
    } catch (error) {
      alert("Error parsing CSV. Format: id,name,email (one per line)")
    }
  }

  const exportAsCSV = () => {
    const csv = students.map((s) => `${s.id},${s.name},${s.email || ""}`).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "student-roster.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="p-6 bg-card border-border">
      <h2 className="text-2xl font-bold text-foreground mb-4">Student Roster</h2>

      <div className="flex gap-2 mb-6">
        <Button
          variant={mode === "manual" ? "default" : "outline"}
          onClick={() => setMode("manual")}
          className="flex-1"
        >
          Add Manually
        </Button>
        <Button variant={mode === "csv" ? "default" : "outline"} onClick={() => setMode("csv")} className="flex-1">
          Import CSV
        </Button>
      </div>

      {mode === "manual" ? (
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Student ID</label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="e.g., STU001"
              className="w-full px-3 py-2 bg-background border border-border rounded text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              onKeyPress={(e) => e.key === "Enter" && addStudent()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Name</label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="e.g., John Doe"
              className="w-full px-3 py-2 bg-background border border-border rounded text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              onKeyPress={(e) => e.key === "Enter" && addStudent()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Email (optional)</label>
            <input
              type="email"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              placeholder="e.g., john@school.com"
              className="w-full px-3 py-2 bg-background border border-border rounded text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              onKeyPress={(e) => e.key === "Enter" && addStudent()}
            />
          </div>
          <Button onClick={addStudent} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            Add Student
          </Button>
        </div>
      ) : (
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Paste CSV (ID, Name, Email)</label>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="STU001,John Doe,john@school.com&#10;STU002,Jane Smith,jane@school.com"
              className="w-full h-32 px-3 py-2 bg-background border border-border rounded text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
            />
          </div>
          <Button onClick={importFromCSV} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            Import Students
          </Button>
        </div>
      )}

      <div className="bg-muted/50 rounded p-4 mb-4">
        <p className="text-sm text-muted-foreground mb-3">
          {students.length === 0
            ? "No students added yet"
            : `${students.length} student${students.length !== 1 ? "s" : ""} in roster`}
        </p>

        <div className="space-y-2 max-h-48 overflow-y-auto">
          {students.map((student) => (
            <div
              key={student.id}
              className="flex items-center justify-between bg-background p-3 rounded border border-border"
            >
              <div className="flex-1">
                <p className="font-mono text-sm text-foreground">{student.id}</p>
                <p className="text-sm text-muted-foreground">{student.name}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeStudent(student.id)}
                className="text-red-500 hover:text-red-700"
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </div>

      {students.length > 0 && (
        <Button onClick={exportAsCSV} variant="outline" className="w-full bg-transparent">
          Export Roster as CSV
        </Button>
      )}
    </Card>
  )
}
