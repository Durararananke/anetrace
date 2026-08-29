import { Database, Search } from "lucide-react"
import { useMemo, useState } from "react"
import { formatTime } from "../lib/format"
import type { VitalCase } from "../types"

interface CaseLibraryProps {
  cases: VitalCase[]
  selectedId: string
  onSelect: (id: string) => void
}

export function CaseLibrary({ cases, selectedId, onSelect }: CaseLibraryProps) {
  const [query, setQuery] = useState("")
  const filteredCases = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return cases
    return cases.filter((caseData) =>
      [caseData.title, caseData.subtitle, caseData.procedure.type, String(caseData.sourceCaseId)]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    )
  }, [cases, query])

  return (
    <aside className="case-library">
      <div className="panel-heading library-heading">
        <div>
          <span className="section-index">01</span>
          <h2>病例库</h2>
        </div>
        <span className="case-count">{String(cases.length).padStart(2, "0")}</span>
      </div>
      <label className="case-search">
        <Search size={15} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索术式或病例编号" />
      </label>
      <div className="case-list">
        {filteredCases.map((caseData, index) => {
          const selected = caseData.id === selectedId
          return (
            <button key={caseData.id} className={`case-card ${selected ? "is-selected" : ""}`} onClick={() => onSelect(caseData.id)}>
              <span className="case-rail" />
              <span className="case-number">CASE {String(index + 1).padStart(2, "0")}</span>
              <strong>{caseData.title}</strong>
              <span className="case-subtitle">{caseData.subtitle}</span>
              <span className="case-card-meta">
                <span>{formatTime(caseData.duration)}</span>
                <span>{Object.keys(caseData.tracks).length} 通道</span>
                <span>#{caseData.sourceCaseId}</span>
              </span>
            </button>
          )
        })}
        {filteredCases.length === 0 && <p className="no-cases">没有匹配病例</p>}
      </div>
      <div className="dataset-stamp">
        <Database size={16} />
        <div><strong>VitalDB v1.0.0</strong><span>公开匿名数据 · CC BY 4.0</span></div>
      </div>
    </aside>
  )
}
