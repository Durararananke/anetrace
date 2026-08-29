import type { TeachingNote } from "../types"

const STORAGE_KEY = "anetrace.teaching-notes.v1"

export function loadNotes(): TeachingNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as TeachingNote[]) : []
  } catch {
    return []
  }
}

export function saveNotes(notes: TeachingNote[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
}

export function exportNotes(notes: TeachingNote[]): string {
  return JSON.stringify({ schemaVersion: 1, type: "anetrace-notes", notes }, null, 2)
}

export function parseNotesFile(content: string): TeachingNote[] {
  const parsed = JSON.parse(content) as { type?: string; notes?: unknown }
  if (parsed.type !== "anetrace-notes" || !Array.isArray(parsed.notes)) {
    throw new Error("不是有效的 AneTrace 标注文件")
  }
  return parsed.notes.filter(isTeachingNote)
}

function isTeachingNote(value: unknown): value is TeachingNote {
  if (!value || typeof value !== "object") return false
  const note = value as Partial<TeachingNote>
  return (
    typeof note.id === "string" &&
    typeof note.caseId === "string" &&
    typeof note.time === "number" &&
    typeof note.text === "string" &&
    ["observation", "question", "teaching"].includes(note.category ?? "")
  )
}
