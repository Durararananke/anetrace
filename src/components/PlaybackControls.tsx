import { Eye, EyeOff, Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react"
import { formatTime } from "../lib/format"

interface PlaybackControlsProps {
  currentTime: number
  duration: number
  playing: boolean
  speed: number
  blindMode: boolean
  challengeMode: boolean
  onPlayingChange: (playing: boolean) => void
  onSpeedChange: (speed: number) => void
  onBlindModeChange: (enabled: boolean) => void
  onChallengeModeChange: (enabled: boolean) => void
  onSeek: (time: number) => void
}

const SPEEDS = [30, 60, 120, 240]

export function PlaybackControls(props: PlaybackControlsProps) {
  const { currentTime, duration, playing, speed, blindMode, challengeMode } = props
  return (
    <div className="playback-controls">
      <div className="transport-buttons">
        <button className="icon-button" aria-label="回到开始" onClick={() => props.onSeek(0)}><RotateCcw size={16} /></button>
        <button className="icon-button" aria-label="后退一分钟" onClick={() => props.onSeek(Math.max(0, currentTime - 60))}><SkipBack size={17} /></button>
        <button className="play-button" aria-label={playing ? "暂停" : "播放"} onClick={() => props.onPlayingChange(!playing)}>
          {playing ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" />}
        </button>
        <button className="icon-button" aria-label="前进一分钟" onClick={() => props.onSeek(Math.min(duration, currentTime + 60))}><SkipForward size={17} /></button>
      </div>
      <div className="timecode"><strong>{formatTime(currentTime)}</strong><span>/ {formatTime(duration)}</span></div>
      <label className="speed-control">
        <span>回放速率</span>
        <select value={speed} onChange={(event) => props.onSpeedChange(Number(event.target.value))}>
          {SPEEDS.map((value) => <option key={value} value={value}>{value}×</option>)}
        </select>
      </label>
      <div className="mode-toggles">
        <button className={`mode-toggle ${blindMode ? "is-active" : ""}`} aria-pressed={blindMode} onClick={() => props.onBlindModeChange(!blindMode)}>
          {blindMode ? <EyeOff size={15} /> : <Eye size={15} />}盲读未来
        </button>
        <button className={`mode-toggle ${challengeMode ? "is-active" : ""}`} aria-pressed={challengeMode} onClick={() => props.onChallengeModeChange(!challengeMode)}>
          <span className="toggle-dot" />自动提问
        </button>
      </div>
    </div>
  )
}
