export type TrackKey = "hr" | "map" | "spo2" | "etco2" | "bis"

export type DataPoint = [time: number, value: number]

export interface TeachingOption {
  id: TrackKey
  label: string
}

export interface TeachingCheckpoint {
  id: string
  time: number
  prompt: string
  options: TeachingOption[]
  answer: TrackKey
  explanation: string
  reviewStatus: "needs-expert-review" | "reviewed"
}

export interface CaseEvent {
  id: string
  time: number
  label: string
  kind: "phase" | "note"
}

export interface VitalCase {
  id: string
  sourceCaseId: number
  title: string
  subtitle: string
  duration: number
  patient: {
    ageBand: string
    sex: string
    asa: string
  }
  procedure: {
    department: string
    type: string
    approach: string
    anesthesia: string
  }
  tracks: Partial<Record<TrackKey, DataPoint[]>>
  trackSources: Partial<Record<TrackKey, string>>
  events: CaseEvent[]
  checkpoints: TeachingCheckpoint[]
  provenance: {
    dataset: string
    license: string
    url: string
    samplingSeconds: number
  }
}

export interface CaseBundle {
  schemaVersion: 1
  generatedAt: string
  disclaimer: string
  cases: VitalCase[]
}

export interface TeachingNote {
  id: string
  caseId: string
  time: number
  category: "observation" | "question" | "teaching"
  text: string
  createdAt: string
}
