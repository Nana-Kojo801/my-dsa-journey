import { Link } from 'react-router-dom'
import type { FunctionReturnType } from 'convex/server'
import { api } from '../../../convex/_generated/api'
import { SkelRow } from '../../components/Skeleton'
import { SlotRows } from '../../components/EmptyState'
import { ScoreCell } from '../../components/ScoreCell'

type DayRow = FunctionReturnType<typeof api.submissions.getDayLeaderboardRows>[number]

export function DayLeaderboard({
  cohortCount,
  rows,
  questionTitle,
  onSelectRow,
}: {
  cohortCount: number | undefined
  rows: DayRow[] | undefined
  questionTitle: string | undefined
  onSelectRow: (row: DayRow) => void
}) {
  return (
    <div className="min-w-0 flex-1 basis-[280px]">
      <div className="mb-5 flex items-baseline justify-between gap-3">
        <div className="font-serif text-[26px]">Today's leaderboard</div>
        <div className="font-mono text-[10.4px] font-medium tracking-[0.14em] text-faint">{cohortCount ?? 0} CLEARED</div>
      </div>

      {rows === undefined ? (
        <div className="border-t border-ink/30">
          {Array.from({ length: 3 }, (_, i) => (
            <SkelRow key={i} className="border-b border-ink/10" />
          ))}
        </div>
      ) : rows.length > 0 ? (
        <div className="border-t border-ink/30">
          {rows.slice(0, 6).map((r, i) => (
            <div
              key={r.submission._id}
              onClick={() => onSelectRow(r)}
              className="flex cursor-pointer items-center gap-3.5 border-b border-ink/10 py-3.5 pr-2.5 transition-colors hover:bg-ink/[.03]"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-ink/24 font-mono text-[12.5px]">
                {String(i + 1).padStart(2, '0')}
              </div>
              <div className="min-w-0 flex-1">
                <div className="overflow-hidden text-ellipsis whitespace-nowrap font-sans text-[16.5px] font-medium">
                  {r.profile?.handle}
                </div>
                <div className="mt-1.5 font-mono text-[10px] font-medium tracking-[0.1em] text-faint">
                  {r.submission.runtimeValue} · {r.submission.memoryValue}
                </div>
              </div>
              <ScoreCell value={Math.round(r.submission.bestScore)} className="font-mono text-[19px]" />
            </div>
          ))}
        </div>
      ) : (
        <div className="border-t border-ink/30">
          <SlotRows count={3} />
          <div className="py-5">
            <div className="mb-2 font-serif text-[19px] leading-[1.3]">
              Nobody's cleared <em className="italic text-red">{questionTitle ?? 'this stage'}</em> yet.
            </div>
            <div className="font-sans text-[13.5px] leading-[1.6] text-mute">
              Upload your accepted screenshot on the left and your handle takes rank 01.
            </div>
          </div>
        </div>
      )}

      <Link to="/board" className="mt-4 inline-block cursor-pointer font-mono text-[10.4px] font-medium tracking-[0.16em] text-red no-underline">
        VIEW THE FULL LEADERBOARD →
      </Link>
    </div>
  )
}
