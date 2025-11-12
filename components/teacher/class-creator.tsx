"use client"

import type React from "react"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface StudentData {
  id: string
  name: string
  email?: string
}

interface ClassCreatorProps {
  onClassCreated: () => void
  onCancel: () => void
}

export const ClassCreator = ({ onClassCreated, onCancel }: ClassCreatorProps) => {
  const [className, setClassName] = useState("")
  const [students, setStudents] = useState<StudentData[]>([])
  const [csvInput, setCsvInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault()
    const input = (e.target as HTMLFormElement).querySelector("input[name='studentId']") as HTMLInputElement
    const nameInput = (e.target as HTMLFormElement).querySelector("input[name='studentName']") as HTMLInputElement
    const emailInput = (e.target as HTMLFormElement).querySelector("input[name='studentEmail']") as HTMLInputElement

    if (input?.value.trim()) {
      const newStudent: StudentData = {
        id: input.value.trim(),
        name: nameInput?.value.trim() || input.value.trim(),
        email: emailInput?.value.trim() || undefined,
      }

      if (!students.find((s) => s.id === newStudent.id)) {
        setStudents([...students, newStudent])
        input.value = ""
        nameInput.value = ""
        emailInput.value = ""
      }
    }
  }

  const handleRemoveStudent = (id: string) => {
    setStudents(students.filter((s) => s.id !== id))
  }

  const handleImportCSV = () => {
    const lines = csvInput
      .trim()
      .split("\n")
      .filter((line) => line.trim())
    const imported: StudentData[] = []

    lines.forEach((line) => {
      const parts = line.split(",").map((p) => p.trim())
      if (parts[0]) {
        const student: StudentData = {
          id: parts[0],
          name: parts[1] || parts[0],
          email: parts[2] || undefined,
        }
        if (!students.find((s) => s.id === student.id) && !imported.find((s) => s.id === student.id)) {
          imported.push(student)
        }
      }
    })

    setStudents([...students, ...imported])
    setCsvInput("")
  }

  const handleCreateClass = async () => {
    if (!className.trim()) {
      alert("Please enter a class name")
      return
    }

    if (students.length === 0) {
      alert("Please add at least one student")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/classes/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          className,
          students,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create class")
      }

      onClassCreated()
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Create New Class</h2>
        <Button onClick={onCancel} className="bg-secondary hover:bg-secondary/90">
          Back
        </Button>
      </div>

      <Card className="p-6 bg-card border-border space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Class Name</label>
          <input
            type="text"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="e.g., Biology 101, Period 3"
            className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="border-t border-border pt-4">
          <h3 className="font-semibold text-foreground mb-4">Add Students</h3>

          <form onSubmit={handleAddStudent} className="space-y-2 mb-4">
            <input
              type="text"
              name="studentId"
              placeholder="Student ID"
              className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="text"
              name="studentName"
              placeholder="Student Name (optional)"
              className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="email"
              name="studentEmail"
              placeholder="Email (optional)"
              className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
              Add Student
            </Button>
          </form>

          <div className="border-t border-border pt-4 mb-4">
            <h4 className="font-medium text-foreground mb-2">Or Import CSV</h4>
            <textarea
              value={csvInput}
              onChange={(e) => setCsvInput(e.target.value)}
              placeholder="ID,Name,Email&#10;S001,John Doe,john@school.com&#10;S002,Jane Smith,jane@school.com"
              className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary min-h-24 font-mono text-sm"
            />
            <Button
              onClick={handleImportCSV}
              disabled={!csvInput.trim()}
              className="w-full mt-2 bg-secondary hover:bg-secondary/90 disabled:opacity-50"
            >
              Import Students
            </Button>
          </div>
        </div>

        {students.length > 0 && (
          <div className="border-t border-border pt-4">
            <h4 className="font-medium text-foreground mb-3">Students Added ({students.length})</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {students.map((student) => (
                <div key={student.id} className="flex items-center justify-between bg-muted/50 p-2 rounded">
                  <div className="text-sm">
                    <p className="font-medium text-foreground">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{student.id}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveStudent(student.id)}
                    className="px-2 py-1 text-xs bg-destructive hover:bg-destructive/90 text-primary-foreground rounded"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <div className="flex gap-4">
        <Button onClick={onCancel} className="flex-1 bg-secondary hover:bg-secondary/90">
          Cancel
        </Button>
        <Button
          onClick={handleCreateClass}
          disabled={isLoading || !className.trim() || students.length === 0}
          className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? "Creating..." : "Create Class"}
        </Button>
      </div>
    </div>
  )
}
