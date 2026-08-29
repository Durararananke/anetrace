import { Check, CircleAlert, X } from "lucide-react"
import { useState } from "react"
import { TRACK_BY_KEY } from "../lib/tracks"
import type { TeachingCheckpoint } from "../types"

interface CheckpointDialogProps {
  checkpoint: TeachingCheckpoint
  onClose: () => void
}

export function CheckpointDialog({ checkpoint, onClose }: CheckpointDialogProps) {
  const [answer, setAnswer] = useState<string | null>(null)
  const isCorrect = answer === checkpoint.answer

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="checkpoint-dialog" role="dialog" aria-modal="true" aria-labelledby="question-title">
        <div className="dialog-kicker">
          <span>趋势检查点</span>
          <span className="review-chip">
            <CircleAlert size={13} /> 待专家审核
          </span>
        </div>
        <h2 id="question-title">先读曲线，再看答案。</h2>
        <p className="question-copy">{checkpoint.prompt}</p>

        <div className="answer-grid">
          {checkpoint.options.map((option) => {
            const selected = answer === option.id
            const revealedCorrect = answer && option.id === checkpoint.answer
            return (
              <button
                key={option.id}
                className={`answer-option ${selected ? "is-selected" : ""} ${revealedCorrect ? "is-correct" : ""}`}
                style={{ "--option-color": TRACK_BY_KEY[option.id].color } as React.CSSProperties}
                onClick={() => setAnswer(option.id)}
                disabled={answer !== null}
              >
                <span className="answer-code">{TRACK_BY_KEY[option.id].shortLabel}</span>
                <span>{option.label}</span>
                {revealedCorrect && <Check size={17} />}
                {selected && !isCorrect && <X size={17} />}
              </button>
            )
          })}
        </div>

        {answer && (
          <div className={`answer-explanation ${isCorrect ? "correct" : "incorrect"}`}>
            <strong>{isCorrect ? "判断一致" : "再看一次基线与当前窗口"}</strong>
            <p>{checkpoint.explanation}</p>
          </div>
        )}

        <div className="dialog-actions">
          <p>本题仅用于观察训练，不构成临床判断。</p>
          <button className="primary-button" onClick={onClose} disabled={!answer}>
            返回回放
          </button>
        </div>
      </section>
    </div>
  )
}
