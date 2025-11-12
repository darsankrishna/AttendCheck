export interface AttendanceSubmission {
  studentId: string
  sessionId: string
  timestamp: string
  selfieImage?: string
  livenessAction?: string
  verified: boolean
}

export interface Student {
  id: string
  name: string
  email?: string
}

export interface Session {
  id: string
  createdAt: string
  expiresAt: string
  submissions: AttendanceSubmission[]
  students?: Student[] // Added optional student roster to sessions
}

export interface Class {
  id: string
  name: string
  students: Student[]
  createdAt: string
}

class AttendanceStore {
  private sessions: Map<string, Session> = new Map()
  private submissions: Map<string, AttendanceSubmission[]> = new Map()
  private classes: Map<string, Class> = new Map()

  createSession(sessionId: string, expiryTime: number, students?: Student[]): Session {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + expiryTime * 1000)

    const session: Session = {
      id: sessionId,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      submissions: [],
      students: students || [], // Store roster with session
    }

    this.sessions.set(sessionId, session)
    return session
  }

  addSubmission(submission: AttendanceSubmission): boolean {
    const session = this.sessions.get(submission.sessionId)
    if (!session) {
      return false
    }

    // Check for duplicates
    const existing = session.submissions.find((s) => s.studentId === submission.studentId)
    if (existing) {
      return false // Already submitted in this session
    }

    session.submissions.push(submission)
    return true
  }

  addStudentsToSession(sessionId: string, students: Student[]): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) {
      return false
    }
    session.students = students
    return true
  }

  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId)
  }

  getSessionStudents(sessionId: string): Student[] {
    const session = this.sessions.get(sessionId)
    return session?.students || []
  }

  getSubmissions(sessionId: string): AttendanceSubmission[] {
    const session = this.sessions.get(sessionId)
    return session?.submissions || []
  }

  exportAsCSV(sessionId: string): string {
    const session = this.sessions.get(sessionId)
    if (!session) {
      return ""
    }

    const headers = ["Student ID", "Timestamp", "Verified", "Liveness Action"]
    const rows = session.submissions.map((s) => [
      s.studentId,
      s.timestamp,
      s.verified ? "Yes" : "No",
      s.livenessAction || "-",
    ])

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    return csv
  }

  getAllSessions(): Session[] {
    return Array.from(this.sessions.values())
  }

  cleanupExpiredSessions(): void {
    const now = new Date()
    for (const [id, session] of this.sessions) {
      if (new Date(session.expiresAt) < now) {
        this.sessions.delete(id)
      }
    }
  }

  addClass(className: string, students: Student[]): Class {
    const classId = `class-${Date.now()}`
    const newClass: Class = {
      id: classId,
      name: className,
      students,
      createdAt: new Date().toISOString(),
    }
    this.classes.set(classId, newClass)
    return newClass
  }

  getClasses(): Class[] {
    return Array.from(this.classes.values())
  }

  getClass(classId: string): Class | undefined {
    return this.classes.get(classId)
  }

  updateClass(classId: string, className: string, students: Student[]): boolean {
    const classData = this.classes.get(classId)
    if (!classData) {
      return false
    }
    classData.name = className
    classData.students = students
    return true
  }

  deleteClass(classId: string): boolean {
    return this.classes.delete(classId)
  }
}

export const store = new AttendanceStore()
