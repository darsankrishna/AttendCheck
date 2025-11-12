import { ValidationError } from "./errors"

export function validateRequired<T extends Record<string, any>>(
  data: T,
  fields: (keyof T)[]
): void {
  const missing: string[] = []

  for (const field of fields) {
    if (data[field] === undefined || data[field] === null || data[field] === "") {
      missing.push(String(field))
    }
  }

  if (missing.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missing.join(", ")}`,
      Object.fromEntries(missing.map((f) => [f, "Required"]))
    )
  }
}

export function validateString(value: unknown, fieldName: string, maxLength?: number): string {
  if (typeof value !== "string") {
    throw new ValidationError(`${fieldName} must be a string`)
  }

  if (value.trim().length === 0) {
    throw new ValidationError(`${fieldName} cannot be empty`)
  }

  if (maxLength && value.length > maxLength) {
    throw new ValidationError(`${fieldName} must be at most ${maxLength} characters`)
  }

  return value.trim()
}

export function validateEmail(email: string): string {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new ValidationError("Invalid email format")
  }
  return email
}

export function validateSessionId(sessionId: string): string {
  if (typeof sessionId !== "string" || sessionId.length < 10) {
    throw new ValidationError("Invalid session ID format")
  }
  return sessionId
}

export function validateStudentId(studentId: string): string {
  const trimmed = validateString(studentId, "Student ID", 100)
  if (trimmed.length < 1) {
    throw new ValidationError("Student ID must be at least 1 character")
  }
  return trimmed
}

