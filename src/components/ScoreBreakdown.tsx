import { MonoLabel, TextButton } from './ui'
import { SkelLines } from './Skeleton'

type BreakdownRow = {
  submission: {
    runtimeValue: string
    memoryValue: string
    runtimePercentile: number
    memoryPercentile: number
    bestScore: number
  }
  question: { title: string; weekNumber: number; dayNumber: number } | null
}

function StatRow({ k, v, c }: { k: string; v: string | number; c?: string }) {
  return (
    <div className="flex items-baseline gap-2.5 border-b border-dotted border-ink/22 py-3.5">
      <div className="font-mono text-[10.4px] font-medium tracking-[0.14em] text-mute">{k}</div>
      <div className="min-w-[10px] flex-1 border-b border-dotted border-ink/28" style={{ transform: 'translateY(-4px)' }} />
      <div className="font-mono text-[21px]" style={{ color: c ?? '#14161A' }}>
        {v}
      </div>
    </div>
  )
}

export function ScoreBreakdownModal({
  handle,
  mode,
  rows,
  onClose,
}: {
  handle: string
  mode: 'daily' | 'aggregate'
  rows: BreakdownRow[] | undefined | null
  onClose: () => void
}) {
  const loading = rows === undefined
  const missing = rows === null
  const hasRows = rows !== undefined && rows !== null && rows.length > 0
  const empty = rows !== undefined && rows !== null && rows.length === 0

  const total = rows ? rows.reduce((sum, r) => sum + r.submission.bestScore, 0) : 0
  const avgRuntime = rows && rows.length ? rows.reduce((s, r) => s + r.submission.runtimePercentile, 0) / rows.length : 0
  const avgMemory = rows && rows.length ? rows.reduce((s, r) => s + r.submission.memoryPercentile, 0) / rows.length : 0
  const daily = hasRows ? rows[0] : null

  return (
    <div onClick={onClose} className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/42 p-4.5">
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-fade max-h-[80vh] w-full max-w-[480px] overflow-y-auto border border-ink/30 bg-ground p-6 shadow-[0_18px_50px_rgba(20,22,26,.22)]"
      >
        <MonoLabel className="mb-3.5">SCORE BREAKDOWN</MonoLabel>
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
          <div className="font-serif text-[30px] leading-[1.1]">{handle}</div>
          {hasRows && (
            <div className="font-mono text-[13px] font-medium tracking-[0.1em] text-mute">
              {mode === 'daily' ? 'SCORE' : 'TOTAL'} <span className="text-[19px] text-red">{total.toLocaleString()}</span>
            </div>
          )}
        </div>

        {loading && <SkelLines count={4} lastWidth="w-1/2" />}

        {missing && (
          <div className="py-4 font-sans text-[15px] leading-[1.6] text-mute">
            That runner's record isn't available anymore.
          </div>
        )}

        {empty && <div className="py-4 font-sans text-[15px] leading-[1.6] text-mute">Nothing cleared in this window yet.</div>}

        {hasRows && daily && mode === 'daily' && (
          <div>
            <StatRow k="RUNTIME" v={daily.submission.runtimeValue} />
            <StatRow k="RUNTIME PERCENTILE" v={`${daily.submission.runtimePercentile.toFixed(1)}%`} c="#C8362B" />
            <StatRow k="MEMORY" v={daily.submission.memoryValue} />
            <StatRow k="MEMORY PERCENTILE" v={`${daily.submission.memoryPercentile.toFixed(1)}%`} />
          </div>
        )}

        {hasRows && mode === 'aggregate' && (
          <div>
            <StatRow k="STAGES CLEARED" v={rows.length} />
            <StatRow k="AVG RUNTIME PERCENTILE" v={`${avgRuntime.toFixed(1)}%`} c="#C8362B" />
            <StatRow k="AVG MEMORY PERCENTILE" v={`${avgMemory.toFixed(1)}%`} />
            <StatRow k="TOTAL SCORE" v={Math.round(total).toLocaleString()} />
          </div>
        )}

        <div className="mt-5.5 flex justify-end">
          <TextButton onClick={onClose} className="border-b border-red/35 py-2">
            CLOSE
          </TextButton>
        </div>
      </div>
    </div>
  )
}
