import { Activity, BadgeInfo, BookOpenCheck, ExternalLink, Menu, Moon, ShieldCheck, Sun, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { CaseLibrary } from "./components/CaseLibrary"
import { CheckpointDialog } from "./components/CheckpointDialog"
import { NotesPanel } from "./components/NotesPanel"
import { PlaybackControls } from "./components/PlaybackControls"
import { WaveformChart } from "./components/WaveformChart"
import { loadCaseBundle } from "./lib/cases"
import { nearestValue } from "./lib/format"
import { loadNotes, saveNotes } from "./lib/storage"
import { TRACKS } from "./lib/tracks"
import type { CaseBundle, TeachingCheckpoint, TeachingNote } from "./types"

interface ToastState {
  message: string
  tone: "default" | "danger"
}

type ThemeMode = "light" | "dark"
const THEME_STORAGE_KEY = "anetrace.theme.v1"

function initialTheme(): ThemeMode {
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === "light" || stored === "dark") return stored
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark"
}

export default function App() {
  const [bundle, setBundle] = useState<CaseBundle | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState("")
  const [currentTime, setCurrentTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(60)
  const [blindMode, setBlindMode] = useState(true)
  const [challengeMode, setChallengeMode] = useState(true)
  const [seenCheckpoints, setSeenCheckpoints] = useState<Record<string, string[]>>({})
  const [activeCheckpoint, setActiveCheckpoint] = useState<TeachingCheckpoint | null>(null)
  const [notes, setNotes] = useState<TeachingNote[]>(loadNotes)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [mobileLibraryOpen, setMobileLibraryOpen] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [theme, setTheme] = useState<ThemeMode>(initialTheme)

  useEffect(() => {
    const controller = new AbortController()
    loadCaseBundle(controller.signal)
      .then((nextBundle) => {
        setBundle(nextBundle)
        setSelectedId(nextBundle.cases[0]?.id ?? "")
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        setLoadError(error instanceof Error ? error.message : "Case data failed to load")
      })
    return () => controller.abort()
  }, [])

  useEffect(() => saveNotes(notes), [notes])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.body.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#101110" : "#e8e8e2")
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 2600)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const currentCase = useMemo(
    () => bundle?.cases.find((candidate) => candidate.id === selectedId) ?? null,
    [bundle, selectedId],
  )

  useEffect(() => {
    if (!playing || !currentCase) return
    const interval = window.setInterval(() => {
      setCurrentTime((previous) => {
        const next = Math.min(currentCase.duration, previous + speed / 10)
        const seen = seenCheckpoints[currentCase.id] ?? []
        const checkpoint = challengeMode
          ? currentCase.checkpoints.find(
              (candidate) => candidate.time > previous && candidate.time <= next && !seen.includes(candidate.id),
            )
          : undefined
        if (checkpoint) {
          setPlaying(false)
          setActiveCheckpoint(checkpoint)
          setSeenCheckpoints((state) => ({
            ...state,
            [currentCase.id]: [...(state[currentCase.id] ?? []), checkpoint.id],
          }))
          return checkpoint.time
        }
        if (next >= currentCase.duration) setPlaying(false)
        return next
      })
    }, 100)
    return () => window.clearInterval(interval)
  }, [challengeMode, currentCase, playing, seenCheckpoints, speed])

  const selectCase = (id: string) => {
    setSelectedId(id)
    setCurrentTime(0)
    setPlaying(false)
    setActiveCheckpoint(null)
    setMobileLibraryOpen(false)
  }

  const seek = (time: number) => {
    if (!currentCase) return
    setCurrentTime(Math.max(0, Math.min(currentCase.duration, time)))
  }

  const notify = (message: string, tone: ToastState["tone"] = "default") => setToast({ message, tone })

  if (loadError) {
    return (
      <main className="system-state error-state">
        <Activity size={34} /><span>DATA LINK FAILED</span><h1>Case data could not be loaded</h1><p>{loadError}</p>
        <button className="primary-button" onClick={() => window.location.reload()}>Reload</button>
      </main>
    )
  }

  if (!bundle || !currentCase) {
    return <main className="system-state"><div className="loading-wave" aria-hidden="true"><i /><i /><i /><i /></div><span>LOADING CASE SIGNALS</span></main>
  }

  const currentNotes = notes.filter((note) => note.caseId === currentCase.id)
  const signalCount = bundle.cases.reduce((count, caseData) => count + Object.keys(caseData.tracks).length, 0)
  const anesthesiaLabel = currentCase.procedure.anesthesia === "Not provided"
    ? currentCase.procedure.anesthesia
    : `${currentCase.procedure.anesthesia} anesthesia`

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <button className="mobile-menu-button" aria-label="Open case library" onClick={() => setMobileLibraryOpen(true)}><Menu size={19} /></button>
          <div className="brand-pulse" aria-hidden="true"><span /></div>
          <div><strong>ANETRACE</strong><span>INTRAOPERATIVE CASE LAB</span></div>
        </div>
        <div className="topbar-center"><span className="system-live"><i /> DATASET ONLINE</span><span>{bundle.cases.length} CASES / {signalCount} SIGNALS</span></div>
        <div className="topbar-actions">
          <button className="icon-button theme-toggle" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button className="text-button" onClick={() => setAboutOpen(true)}><BadgeInfo size={16} /> Data &amp; safety</button>
        </div>
      </header>

      <div className="workspace-grid">
        <div className={`mobile-library-backdrop ${mobileLibraryOpen ? "is-open" : ""}`}>
          <button aria-label="Close case library" onClick={() => setMobileLibraryOpen(false)} />
          <div className="mobile-library-sheet">
            <button className="mobile-close" aria-label="Close" onClick={() => setMobileLibraryOpen(false)}><X size={18} /></button>
            <CaseLibrary cases={bundle.cases} selectedId={currentCase.id} onSelect={selectCase} />
          </div>
        </div>
        <div className="desktop-library"><CaseLibrary cases={bundle.cases} selectedId={currentCase.id} onSelect={selectCase} /></div>

        <main className="case-workspace">
          <section className="case-heading">
            <div><span className="section-index">02 / CASE #{currentCase.sourceCaseId}</span><h1>{currentCase.title}</h1><p>{currentCase.subtitle}</p></div>
            <div className="case-demographics">
              <span>{currentCase.patient.ageBand}</span><span>{currentCase.patient.sex}</span><span>{currentCase.patient.asa}</span><span>{anesthesiaLabel}</span>
            </div>
          </section>

          <section className="monitor-console">
            <div className="monitor-header">
              <div className="monitor-title"><span className="record-dot" /><strong>MULTI-PARAMETER TREND</strong><span>10 SEC RESAMPLE</span></div>
              <div className="vital-readouts">
                {TRACKS.filter((track) => currentCase.tracks[track.key]).map((track) => {
                  const value = nearestValue(currentCase.tracks[track.key], currentTime)
                  return (
                    <div key={track.key} className="vital-readout" style={{ "--signal": track.color } as React.CSSProperties}>
                      <span>{track.shortLabel}</span><strong>{value === null ? "—" : value.toFixed(track.decimals)}</strong><small>{track.unit}</small>
                    </div>
                  )
                })}
              </div>
            </div>
            <WaveformChart caseData={currentCase} currentTime={currentTime} blindMode={blindMode} notes={currentNotes} onSeek={seek} />
            <PlaybackControls
              currentTime={currentTime} duration={currentCase.duration} playing={playing} speed={speed}
              blindMode={blindMode} challengeMode={challengeMode} onPlayingChange={setPlaying}
              onSpeedChange={setSpeed} onBlindModeChange={setBlindMode}
              onChallengeModeChange={setChallengeMode} onSeek={seek}
            />
          </section>

          <section className="case-facts">
            <div className="fact-block"><span>DEPARTMENT</span><strong>{currentCase.procedure.department}</strong></div>
            <div className="fact-block"><span>PROCEDURE TYPE</span><strong>{currentCase.procedure.type}</strong></div>
            <div className="fact-block"><span>APPROACH</span><strong>{currentCase.procedure.approach}</strong></div>
            <div className="fact-block fact-wide"><span>DATA SOURCE</span><strong>{currentCase.provenance.dataset}</strong><a href={currentCase.provenance.url} target="_blank" rel="noreferrer">{currentCase.provenance.license} <ExternalLink size={12} /></a></div>
          </section>
        </main>

        <NotesPanel caseId={currentCase.id} currentTime={currentTime} notes={notes} onChange={setNotes} onJump={seek} onNotify={notify} />
      </div>

      <footer className="safety-strip"><ShieldCheck size={14} /><strong>EDUCATION ONLY</strong><span>{bundle.disclaimer}</span></footer>
      {activeCheckpoint && <CheckpointDialog checkpoint={activeCheckpoint} onClose={() => setActiveCheckpoint(null)} />}

      {aboutOpen && (
        <div className="dialog-backdrop" role="presentation">
          <section className="about-dialog" role="dialog" aria-modal="true" aria-labelledby="about-title">
            <button className="dialog-close" aria-label="Close" onClick={() => setAboutOpen(false)}><X size={18} /></button>
            <BookOpenCheck size={30} className="about-icon" /><span className="dialog-kicker">DATA PROVENANCE / SAFETY</span>
            <h2 id="about-title">Real signals. Clear teaching boundaries.</h2>
            <p>Demonstration cases come from the public, de-identified VitalDB v1.0.0 dataset. AneTrace replays and describes monitored trends only; it does not generate diagnoses, risk predictions, drug doses, or treatment advice.</p>
            <ul><li>Case data is resampled at 10-second intervals and cannot be used for real-time monitoring.</li><li>Every generated question remains marked for anesthesia specialist review.</li><li>Personal annotations stay in this browser unless you export them.</li></ul>
            <a className="primary-button link-button" href="https://physionet.org/content/vitaldb/1.0.0/" target="_blank" rel="noreferrer">View the VitalDB data description <ExternalLink size={14} /></a>
          </section>
        </div>
      )}
      {toast && <div className={`toast toast-${toast.tone}`}>{toast.message}</div>}
    </div>
  )
}
