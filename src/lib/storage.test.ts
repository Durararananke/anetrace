import { beforeEach, describe, expect, it } from "vitest"
import { exportNotes, loadNotes, parseNotesFile, saveNotes } from "./storage"
import type { TeachingNote } from "../types"

const note: TeachingNote = {
  id: "note-1",
  caseId: "case-1",
  time: 120,
  category: "observation",
  text: "Observe the blood pressure trend",
  createdAt: "2026-08-29T00:00:00Z",
}

describe("teaching-note persistence", () => {
  beforeEach(() => localStorage.clear())

  it("round-trips browser storage and export files", () => {
    saveNotes([note])
    expect(loadNotes()).toEqual([note])
    expect(parseNotesFile(exportNotes([note]))).toEqual([note])
  })

  it("rejects files from another application", () => {
    expect(() => parseNotesFile('{"type":"unknown","notes":[]}')).toThrow("This is not a valid AneTrace annotation file")
  })

  it("ignores malformed note entries", () => {
    const value = JSON.stringify({ type: "anetrace-notes", notes: [note, { id: 2 }] })
    expect(parseNotesFile(value)).toEqual([note])
  })
})
