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
    label: "心率",
    shortLabel: "HR",
    unit: "bpm",
    color: "#68f5c4",
    domain: [30, 170],
    decimals: 0,
  },
  {
    key: "map",
    label: "平均动脉压",
    shortLabel: "MAP",
    unit: "mmHg",
    color: "#ff6b72",
    domain: [20, 170],
    decimals: 0,
  },
  {
    key: "spo2",
    label: "血氧饱和度",
    shortLabel: "SpO₂",
    unit: "%",
    color: "#72b7ff",
    domain: [70, 100],
    decimals: 0,
  },
  {
    key: "etco2",
    label: "呼气末二氧化碳",
    shortLabel: "EtCO₂",
    unit: "mmHg",
    color: "#f5df68",
    domain: [10, 65],
    decimals: 0,
  },
  {
    key: "bis",
    label: "脑电双频指数",
    shortLabel: "BIS",
    unit: "",
    color: "#d9a7ff",
    domain: [0, 100],
    decimals: 0,
  },
]

export const TRACK_BY_KEY = Object.fromEntries(TRACKS.map((track) => [track.key, track])) as Record<
  TrackKey,
  TrackDefinition
>
