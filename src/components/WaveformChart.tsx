import { useId, useMemo, useRef } from "react"
import { formatTime, nearestValue } from "../lib/format"
import { TRACKS } from "../lib/tracks"
import type { DataPoint, TeachingNote, VitalCase } from "../types"

interface WaveformChartProps {
  caseData: VitalCase
  currentTime: number
  blindMode: boolean
  notes: TeachingNote[]
  onSeek: (time: number) => void
}

const WIDTH = 1200
const LABEL_WIDTH = 102
const RIGHT_PADDING = 18
const LANE_HEIGHT = 84
const TOP = 30

export function WaveformChart({
  caseData,
  currentTime,
  blindMode,
  notes,
  onSeek,
}: WaveformChartProps) {
  const patternId = useId().replaceAll(":", "")
  const svgRef = useRef<SVGSVGElement>(null)
  const visibleTracks = TRACKS.filter((track) => caseData.tracks[track.key]?.length)
  const height = TOP + visibleTracks.length * LANE_HEIGHT + 28
  const plotWidth = WIDTH - LABEL_WIDTH - RIGHT_PADDING
  const currentX = LABEL_WIDTH + (currentTime / caseData.duration) * plotWidth

  const paths = useMemo(
    () =>
      visibleTracks.map((track, index) => ({
        track,
        path: createPath(
          caseData.tracks[track.key] ?? [],
          caseData.duration,
          track.domain,
          index,
          plotWidth,
        ),
      })),
    [caseData, plotWidth, visibleTracks],
  )

  const handlePointer = (clientX: number) => {
    const bounds = svgRef.current?.getBoundingClientRect()
    if (!bounds) return
    const x = ((clientX - bounds.left) / bounds.width) * WIDTH
    const ratio = Math.max(0, Math.min(1, (x - LABEL_WIDTH) / plotWidth))
    onSeek(ratio * caseData.duration)
  }

  return (
    <div className="waveform-shell">
      <svg
        ref={svgRef}
        className="waveform-chart"
        viewBox={`0 0 ${WIDTH} ${height}`}
        role="img"
        aria-label={`${caseData.title} 多参数监护趋势图`}
        onPointerDown={(event) => handlePointer(event.clientX)}
      >
        <defs>
          <pattern id={patternId} width="9" height="9" patternUnits="userSpaceOnUse">
            <path d="M-2 2L2-2M0 9L9 0M7 11L11 7" stroke="#24313a" strokeWidth="1" />
          </pattern>
          <clipPath id={`${patternId}-visible`}>
            <rect
              x={LABEL_WIDTH}
              y={0}
              width={blindMode ? Math.max(0, currentX - LABEL_WIDTH) : plotWidth}
              height={height}
            />
          </clipPath>
        </defs>

        <rect width={WIDTH} height={height} fill="#0d151b" />
        <rect x={LABEL_WIDTH} y={TOP} width={plotWidth} height={height - TOP - 28} fill="#0a1015" />

        {Array.from({ length: 9 }, (_, index) => {
          const x = LABEL_WIDTH + (index / 8) * plotWidth
          return (
            <g key={index}>
              <line x1={x} y1={TOP} x2={x} y2={height - 28} className="chart-grid-major" />
              <text x={x} y={height - 9} textAnchor="middle" className="chart-time-label">
                {formatTime((index / 8) * caseData.duration)}
              </text>
            </g>
          )
        })}

        {visibleTracks.map((track, index) => {
          const y = TOP + index * LANE_HEIGHT
          const value = nearestValue(caseData.tracks[track.key], currentTime)
          return (
            <g key={track.key}>
              <rect x={0} y={y} width={LABEL_WIDTH} height={LANE_HEIGHT} className="chart-label-cell" />
              <line
                x1={0}
                y1={y + LANE_HEIGHT}
                x2={WIDTH}
                y2={y + LANE_HEIGHT}
                className="chart-lane-line"
              />
              <line
                x1={LABEL_WIDTH}
                y1={y + LANE_HEIGHT / 2}
                x2={WIDTH - RIGHT_PADDING}
                y2={y + LANE_HEIGHT / 2}
                className="chart-grid-minor"
              />
              <text x={16} y={y + 27} className="chart-track-label" fill={track.color}>
                {track.shortLabel}
              </text>
              <text x={16} y={y + 56} className="chart-track-value" fill={track.color}>
                {value === null ? "—" : value.toFixed(track.decimals)}
              </text>
              <text x={75} y={y + 56} className="chart-track-unit">
                {track.unit}
              </text>
            </g>
          )
        })}

        <g clipPath={`url(#${patternId}-visible)`}>
          {paths.map(({ track, path }) => (
            <path
              key={track.key}
              d={path}
              fill="none"
              stroke={track.color}
              strokeWidth="2.2"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              className="signal-path"
            />
          ))}
        </g>

        {caseData.events.map((event) => {
          const x = LABEL_WIDTH + (event.time / caseData.duration) * plotWidth
          return (
            <g key={event.id} className="event-marker">
              <line x1={x} y1={TOP} x2={x} y2={height - 28} />
              <text x={x + 5} y={18}>
                {event.label}
              </text>
            </g>
          )
        })}

        {notes.map((note) => {
          const x = LABEL_WIDTH + (note.time / caseData.duration) * plotWidth
          return (
            <g key={note.id} className="note-marker">
              <path d={`M${x - 5} ${TOP + 3}h10l-5 8z`} />
              <line x1={x} y1={TOP + 11} x2={x} y2={height - 28} />
            </g>
          )
        })}

        {blindMode && currentX < WIDTH - RIGHT_PADDING && (
          <g className="blind-zone">
            <rect
              x={currentX}
              y={TOP}
              width={WIDTH - RIGHT_PADDING - currentX}
              height={height - TOP - 28}
              fill={`url(#${patternId})`}
            />
            <text x={currentX + 16} y={TOP + 24}>
              FUTURE DATA MASKED
            </text>
          </g>
        )}

        <line x1={currentX} y1={TOP} x2={currentX} y2={height - 28} className="playhead" />
        <path d={`M${currentX - 6} ${TOP - 1}h12l-6 8z`} className="playhead-cap" />
      </svg>
    </div>
  )
}

function createPath(
  points: DataPoint[],
  duration: number,
  [min, max]: [number, number],
  laneIndex: number,
  plotWidth: number,
): string {
  let previousTime = -Infinity
  return points
    .map(([time, value]) => {
      const x = LABEL_WIDTH + (time / duration) * plotWidth
      const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)))
      const y = TOP + laneIndex * LANE_HEIGHT + LANE_HEIGHT - 9 - ratio * (LANE_HEIGHT - 18)
      const command = time - previousTime > 35 ? "M" : "L"
      previousTime = time
      return `${command}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(" ")
}
