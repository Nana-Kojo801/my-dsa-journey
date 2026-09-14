import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Skel } from '../../components/Skeleton'
import { ScoreCell } from '../../components/ScoreCell'
import { formatPretty } from '../../lib/date'

export function RunnersTab() {
  const runners = useQuery(api.admin.getAllRunners)

  if (runners === undefined) {
    return (
      <div>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-3.5 border-b border-ink/10 py-3.5">
            <Skel className="h-3 w-8" />
            <Skel className="h-3.5 flex-1" />
            <Skel className="h-3 w-14" />
          </div>
        ))}
      </div>
    )
  }

  if (runners === null) {
    return <div className="font-sans text-mute">This page is for the creator only.</div>
  }

  return (
    <div>
      <div className="mb-4.5 font-mono text-[10.4px] font-medium tracking-[0.2em] text-faint">
        {runners.length} RUNNER{runners.length === 1 ? '' : 'S'} · SORTED DESC BY SCORE
      </div>
      <div className="flex items-baseline gap-2.5 border-b border-ink/30 pb-2.5 font-mono text-[9.8px] font-medium tracking-[0.16em] text-faint">
        <div className="w-8.5">#</div>
        <div className="flex-1">HANDLE</div>
        <div className="hidden w-24 text-right sm:block">JOINED</div>
        <div className="w-14 text-right">STREAK</div>
        <div className="w-14 text-right">FREEZES</div>
        <div className="w-16 text-right">SCORE</div>
      </div>
      {runners.map((r) => (
        <div key={r.handle} className="flex items-baseline gap-2.5 border-b border-dotted border-ink/20 py-3">
          <div className="w-8.5 font-mono text-[11.5px] text-faint">[{String(r.rank).padStart(2, '0')}]</div>
          <div className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-sans text-[16px] font-medium">
            {r.handle}
            {r.isAdmin && <span className="ml-2 font-mono text-[9px] font-medium tracking-[0.1em] text-red">ADMIN</span>}
          </div>
          <div className="hidden w-24 text-right font-mono text-[11.5px] text-faint sm:block">{formatPretty(new Date(r.joinedAt).toISOString().slice(0, 10))}</div>
          <div className="w-14 text-right font-mono text-[12.6px]" style={{ color: r.currentStreak >= 7 ? '#0A7A52' : '#6E7178' }}>
            {r.currentStreak}d
          </div>
          <div className="w-14 text-right font-mono text-[12.6px] text-mute">{r.freezesRemaining}</div>
          <ScoreCell value={r.totalScore} className="w-16 text-right font-mono text-[17px]" />
        </div>
      ))}
      {runners.length === 0 && <div className="py-8 text-center font-sans text-mute">No runners yet.</div>}
    </div>
  )
}
