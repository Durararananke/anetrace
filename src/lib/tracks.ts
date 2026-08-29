import type { TrackKey } from "../types"

export interface TrackDefinition {
  key: TrackKey
  label: string
  shortLabel: string
  unit: string
  color: string
  domain: [number, number]
  decimals: number
}

export const TRACKS: TrackDefinition[] = [
  {
    key: "hr",
    label: "Heart rate",
    shortLabel: "HR",
    unit: "bpm",
    color: "var(--signal-hr)",
    domain: [30, 170],
    decimals: 0,
  },
  {
    key: "map",
    label: "Mean arterial pressure",
    shortLabel: "MAP",
    unit: "mmHg",
    color: "var(--signal-map)",
    domain: [20, 170],
    decimals: 0,
  },
  {
    key: "spo2",
    label: "Oxygen saturation",
    shortLabel: "SpO₂",
    unit: "%",
    color: "var(--signal-spo2)",
    domain: [70, 100],
    decimals: 0,
  },
  {
    key: "etco2",
    label: "End-tidal carbon dioxide",
    shortLabel: "EtCO₂",
    unit: "mmHg",
    color: "var(--signal-etco2)",
    domain: [10, 65],
    decimals: 0,
  },
  {
    key: "bis",
    label: "Bispectral index",
    shortLabel: "BIS",
    unit: "",
    color: "var(--signal-bis)",
    domain: [0, 100],
    decimals: 0,
  },
]

export const TRACK_BY_KEY = Object.fromEntries(TRACKS.map((track) => [track.key, track])) as Record<
  TrackKey,
  TrackDefinition
>
