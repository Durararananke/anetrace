import { Download, FileUp, MapPin, Plus, Trash2 } from "lucide-react"
import { useRef, useState } from "react"
import { exportNotes, parseNotesFile } from "../lib/storage"
import { formatTime } from "../lib/format"
import type { TeachingNote } from "../types"

interface NotesPanelProps {
  caseId: string
  currentTime: number
  notes: TeachingNote[]
  onChange: (notes: TeachingNote[]) => void
  onJump: (time: number) => void
  onNotify: (message: string, tone?: "default" | "danger") => void
}

const CATEGORY_LABELS = {
  observation: "观察",
  question: "讨论",
  teaching: "教学点",
}

export function NotesPanel({
  caseId,
  currentTime,
  notes,
  onChange,
  onJump,
  onNotify,
}: NotesPanelProps) {
  const [text, setText] = useState("")
  const [category, setCategory] = useState<TeachingNote["category"]>("observation")
  const importRef = useRef<HTMLInputElement>(null)
  const caseNotes = notes.filter((note) => note.caseId === caseId).sort((a, b) => a.time - b.time)

  const addNote = () => {
    const cleanText = text.trim()
    if (!cleanText) return
    const note: TeachingNote = {
      id: crypto.randomUUID(),
      caseId,
      time: Math.round(currentTime),
      category,
      text: cleanText,
      createdAt: new Date().toISOString(),
    }
    onChange([...notes, note])
    setText("")
    onNotify("标注已保存在本机")
  }

  const download = () => {
    const blob = new Blob([exportNotes(notes)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `anetrace-notes-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const importFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const incoming = parseNotesFile(await file.text())
      const merged = new Map([...notes, ...incoming].map((note) => [note.id, note]))
      onChange([...merged.values()])
      onNotify(`已导入 ${incoming.length} 条标注`)
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "标注导入失败", "danger")
    } finally {
      if (importRef.current) importRef.current.value = ""
    }
  }

  return (
    <aside className="notes-panel">
      <div className="panel-heading">
        <div>
          <span className="section-index">03</span>
          <h2>教学标注</h2>
        </div>
        <span className="local-badge">LOCAL ONLY</span>
      </div>

      <div className="note-composer">
        <div className="composer-meta">
          <span>
            <MapPin size={14} /> {formatTime(currentTime)}
          </span>
          <select value={category} onChange={(event) => setCategory(event.target.value as TeachingNote["category"])}>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="记录观察、讨论问题或教学要点……"
          rows={4}
        />
        <button className="add-note-button" onClick={addNote} disabled={!text.trim()}>
          <Plus size={16} /> 固定到当前时间
        </button>
      </div>

      <div className="notes-list" aria-live="polite">
        {caseNotes.length === 0 ? (
          <div className="empty-notes">
            <span>NO ANNOTATIONS</span>
            <p>播放到关键位置，在这里留下教学标记。</p>
          </div>
        ) : (
          caseNotes.map((note) => (
            <article key={note.id} className={`note-card note-${note.category}`}>
              <button className="note-time" onClick={() => onJump(note.time)}>
                {formatTime(note.time)}
              </button>
              <span className="note-category">{CATEGORY_LABELS[note.category]}</span>
              <p>{note.text}</p>
              <button
                className="icon-button delete-note"
                aria-label="删除标注"
                onClick={() => onChange(notes.filter((candidate) => candidate.id !== note.id))}
              >
                <Trash2 size={14} />
              </button>
            </article>
          ))
        )}
      </div>

      <div className="notes-footer">
        <input
          ref={importRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(event) => void importFile(event.target.files?.[0])}
        />
        <button className="secondary-button" onClick={() => importRef.current?.click()}>
          <FileUp size={15} /> 导入
        </button>
        <button className="secondary-button" onClick={download} disabled={!notes.length}>
          <Download size={15} /> 导出全部
        </button>
      </div>
    </aside>
  )
}
