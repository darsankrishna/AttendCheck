"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface StudentData {
  id: string
  name: string
  email: string
}

interface ClassData {
  id: string
  name: string
  students: StudentData[]
}

interface ClassSelectorProps {
  onClassSelected: (students: StudentData[]) => void
  onCreateNew: () => void
}

export const ClassSelector = ({ onClassSelected, onCreateNew }: ClassSelectorProps) => {
  const [classes, setClasses] = useState<ClassData[]>([])
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setIsLoading(true)
        console.log("[v0] Fetching classes from /api/classes/list")
        const response = await fetch("/api/classes/list")
        console.log("[v0] Response status:", response.status)
        if (!response.ok) {
          const errorText = await response.text()
          console.log("[v0] Error response:", errorText)
          throw new Error("Failed to fetch classes")
        }
        const data = await response.json()
        console.log("[v0] Classes fetched:", data)
        setClasses(data)
        setError(null)
      } catch (err) {
        console.log("[v0] Error fetching classes:", err)
        if (err instanceof SyntaxError) {
          console.log("[v0] JSON parsing error - the API returned invalid JSON")
          setError("Server error: Invalid response format")
        } else {
          setError(err instanceof Error ? err.message : "Failed to load classes")
        }
        setClasses([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchClasses()
  }, [])

  const handleSelectClass = (classData: ClassData) => {
    setSelectedClass(classData)
    onClassSelected(classData.students)
  }

  const handleDeleteClass = async (classId: string) => {
    if (!confirm("Are you sure you want to delete this class?")) return

    try {
      const response = await fetch(`/api/classes/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId }),
      })
      if (!response.ok) throw new Error("Failed to delete class")

      setClasses(classes.filter((c) => c.id !== classId))
      if (selectedClass?.id === classId) {
        setSelectedClass(null)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete class")
    }
  }

  if (isLoading) {
    return (
      <Card className="p-8 bg-card border-border text-center">
        <p className="text-muted-foreground">Loading classes...</p>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-8 bg-card border-border text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={onCreateNew} className="bg-primary hover:bg-primary/90">
          Create Your First Class
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Select or Create Class</h2>
        <Button onClick={onCreateNew} className="bg-primary hover:bg-primary/90">
          Create New Class
        </Button>
      </div>

      {classes.length === 0 ? (
        <Card className="p-8 bg-card border-border text-center">
          <p className="text-muted-foreground mb-4">No classes created yet</p>
          <Button onClick={onCreateNew} className="bg-primary hover:bg-primary/90">
            Create Your First Class
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classes.map((classData) => (
            <Card
              key={classData.id}
              onClick={() => handleSelectClass(classData)}
              className={`p-4 cursor-pointer border-2 transition-colors ${
                selectedClass?.id === classData.id
                  ? "bg-primary/10 border-primary"
                  : "bg-card border-border hover:border-primary/50"
              }`}
            >
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground text-lg">{classData.name}</h3>
                <p className="text-sm text-muted-foreground">{classData.students.length} students</p>
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteClass(classData.id)
                    }}
                    className="flex-1 bg-destructive hover:bg-destructive/90 text-sm"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedClass && (
        <Card className="p-4 bg-primary/5 border-primary">
          <p className="text-sm text-foreground">
            Selected: <strong>{selectedClass.name}</strong> ({selectedClass.students.length} students)
          </p>
        </Card>
      )}
    </div>
  )
}
