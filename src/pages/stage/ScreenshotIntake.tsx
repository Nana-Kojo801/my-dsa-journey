import { useRef } from 'react'
import { OutlineButton, PrimaryButton, TextButton, MonoLabel } from '../../components/ui'
import type { Extracted, Best } from './types'

type Phase = 'idle' | 'processing' | 'failed'

export function ScreenshotIntake({
  phase,
  current,
  best,
  justSubmitted,
  celebrateKey,
  failReason,
  onFile,
  onOpenHelp,
  onOpenFeedback,
}: {
  phase: Phase
  current: Extracted | null
  best: Best
  justSubmitted: boolean
  celebrateKey: number
  failReason: string
  onFile: (file: File) => void
  onOpenHelp: () => void
  onOpenFeedback: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="min-w-0 flex-1 basis-[300px]">
      <div className="mb-4 flex items-center gap-2.5">
        <MonoLabel>PROOF · SCREENSHOT INTAKE</MonoLabel>
        <button
          onClick={onOpenHelp}
          title="How to take the screenshot"
          className="flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-full border border-ink/30 font-mono text-[9px] font-medium text-mute hover:border-ink hover:text-ink"
        >
          ?
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
          e.target.value = ''
        }}
      />

      {phase === 'idle' && current === null && (
        <div
          onClick={() => fileRef.current?.click()}
          className="relative cursor-pointer border border-ink/20 bg-paper px-6 py-11 text-center hover:border-red"
        >
          <div className="mb-2.5 font-serif text-[27.6px] leading-[1.2]">
            Drop the accepted
            <br />
            submission here
          </div>
          <div className="mx-auto mb-5.5 max-w-[32ch] font-sans text-[15px] leading-[1.6] text-mute">
            PNG or JPG of the results panel. Read once, extracted, then destroyed — nothing is stored.
          </div>
          <div className="inline-block bg-ink px-4.5 py-2.5 font-mono text-[10.9px] font-medium tracking-[0.18em] text-ground">
            CHOOSE FILE
          </div>
          <div className="mt-4 font-mono text-[9.8px] font-medium tracking-[0.1em] text-faint">OR PASTE WITH CTRL+V / ⌘V</div>
        </div>
      )}

      {phase === 'processing' && (
        <div className="relative overflow-hidden border border-ink/20 bg-paper px-6 py-13 text-center">
          <div className="animate-pulse absolute inset-x-0 top-0 h-px bg-red" />
          <div className="mb-3 font-serif text-[27.6px] leading-[1.2]">Reading the panel…</div>
          <div className="animate-tick font-mono text-[10.9px] font-medium tracking-[0.18em] text-red">VISION MODEL · 4 FIELDS</div>
        </div>
      )}

      {phase === 'idle' && current !== null && (
        <div className="relative">
          {justSubmitted && (
            <div key={celebrateKey} className="pointer-events-none absolute -top-3 right-0 z-10 -rotate-[9deg]">
              <div className="animate-stamp-in border-[3px] border-red px-3.5 py-1 font-mono text-[15px] font-bold tracking-[0.16em] text-red">
                CLEARED
              </div>
            </div>
          )}
          {[
            { k: 'RUNTIME', v: current.runtimeValue, c: '#14161A' },
            { k: 'RUNTIME PERCENTILE', v: `${current.runtimePercentile.toFixed(1)}%`, c: '#C8362B' },
            { k: 'MEMORY', v: current.memoryValue, c: '#14161A' },
            { k: 'MEMORY PERCENTILE', v: `${current.memoryPercentile.toFixed(1)}%`, c: '#14161A' },
          ].map((e) => (
            <div key={e.k} className="flex items-baseline gap-2.5 border-b border-dotted border-ink/22 py-3.5">
              <div className="whitespace-nowrap font-mono text-[10.4px] font-medium tracking-[0.16em] text-mute">{e.k}</div>
              <div className="min-w-[10px] flex-1 border-b border-dotted border-ink/28" style={{ transform: 'translateY(-4px)' }} />
              <div className="font-mono text-[23px]" style={{ color: e.c }}>
                {e.v}
              </div>
            </div>
          ))}
          {best && (
            <div className="mt-4 flex items-center gap-2.5 border-l-2 border-amber bg-[#FFF8E8] px-3.5 py-3">
              <div className="flex-1 font-sans text-[14.4px] leading-[1.5] text-[#4A3B12]">
                High-water mark held for the board — your best runtime on this stage stands at{' '}
                <strong>{best.runtimePercentile.toFixed(1)}%</strong> while the values above show the latest run.
              </div>
            </div>
          )}
          <div className="mt-5.5 flex flex-wrap gap-4">
            <OutlineButton onClick={() => fileRef.current?.click()}>RESUBMIT</OutlineButton>
            <TextButton onClick={onOpenFeedback} className="border-b border-red/35 py-3">
              THAT READ IS WRONG
            </TextButton>
          </div>
        </div>
      )}

      {phase === 'failed' && (
        <div className="border-l-2 border-red bg-[#FFF5F4] p-5.5">
          <MonoLabel className="mb-3.5 text-red">EXTRACTION FAILED · 0 OF 4 FIELDS</MonoLabel>
          <div className="mb-3 font-serif text-[27.6px] leading-[1.2]">We couldn't find the percentiles.</div>
          <div className="mb-5.5 font-sans text-[16.1px] leading-[1.65] text-mute">{failReason}</div>
          <div className="flex flex-wrap gap-4">
            <PrimaryButton onClick={() => fileRef.current?.click()}>TRY AGAIN</PrimaryButton>
            <TextButton onClick={onOpenFeedback} className="border-b border-red/35 py-3">
              FILE A READER BUG
            </TextButton>
          </div>
        </div>
      )}
    </div>
  )
}
