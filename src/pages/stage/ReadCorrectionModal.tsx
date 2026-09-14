import { MonoLabel, PrimaryButton } from '../../components/ui'
import { FB_FIELDS, type FeedbackField } from './types'

export function ReadCorrectionModal({
  question,
  sent,
  field,
  onFieldChange,
  note,
  onNoteChange,
  onSubmit,
  onDone,
  onClose,
}: {
  question: { weekNumber: number; dayNumber: number; title: string } | null | undefined
  sent: boolean
  field: FeedbackField
  onFieldChange: (field: FeedbackField) => void
  note: string
  onNoteChange: (note: string) => void
  onSubmit: () => void
  onDone: () => void
  onClose: () => void
}) {
  return (
    <div onClick={onClose} className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/42 p-4.5">
      <div onClick={(e) => e.stopPropagation()} className="animate-fade w-full max-w-[480px] border border-ink/30 bg-ground p-6 shadow-[0_18px_50px_rgba(20,22,26,.22)]">
        {sent ? (
          <div>
            <MonoLabel className="mb-4 text-green">FILED · QUEUED FOR THE READER</MonoLabel>
            <div className="mb-3.5 font-serif text-[30px] leading-[1.1]">Correction logged.</div>
            <div className="mb-6.5 font-sans text-[16.7px] leading-[1.7] text-mute">
              Your submission stands as-is for now. When the reader is fixed we re-run the extraction and your board
              number updates automatically.
            </div>
            <PrimaryButton onClick={onDone} className="w-full text-center">
              DONE
            </PrimaryButton>
          </div>
        ) : (
          <div>
            <MonoLabel className="mb-4">
              LV {question ? String(question.weekNumber).padStart(2, '0') : '—'} · STAGE {question?.dayNumber ?? '—'} ·{' '}
              {question?.title.toUpperCase() ?? ''}
            </MonoLabel>
            <div className="mb-6 font-serif text-[30px] leading-[1.1]">
              What did the
              <br />
              reader misread?
            </div>
            <div className="mb-3 font-mono text-[9.8px] font-medium tracking-[0.18em] text-mute">FIELD</div>
            <div className="mb-6 flex flex-wrap gap-2">
              {FB_FIELDS.map((f) => (
                <button
                  key={f}
                  onClick={() => onFieldChange(f)}
                  className="cursor-pointer border px-3 py-2 font-mono text-[10.4px] font-medium tracking-[0.1em]"
                  style={{
                    borderColor: field === f ? '#14161A' : 'rgba(20,22,26,.24)',
                    background: field === f ? '#14161A' : 'transparent',
                    color: field === f ? '#FBFBF8' : '#6E7178',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="mb-3 font-mono text-[9.8px] font-medium tracking-[0.18em] text-mute">WHAT IT SHOULD HAVE BEEN</div>
            <textarea
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="It read memory as 12% but the panel said 71.4%."
              className="mb-6.5 w-full min-h-[88px] resize-y border border-ink/24 bg-paper p-3.5 font-sans text-[16.7px] leading-[1.6] outline-none focus:border-red"
            />
            <div className="flex flex-wrap items-center justify-end gap-4">
              <button onClick={onClose} className="cursor-pointer font-mono text-[10.9px] font-medium tracking-[0.16em] text-mute">
                CANCEL
              </button>
              <button
                onClick={onSubmit}
                className="cursor-pointer bg-red px-4.5 py-3.5 font-mono text-[10.9px] font-medium tracking-[0.16em] text-ground"
              >
                FILE CORRECTION
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
