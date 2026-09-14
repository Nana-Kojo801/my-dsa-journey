import { useState, type ReactNode } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { Skel, SkelRow } from '../components/Skeleton'
import { EmptyState, SlotRows } from '../components/EmptyState'
import { ScoreBreakdownModal } from '../components/ScoreBreakdown'
import { ScoreCell } from '../components/ScoreCell'

const FILTERS = ['Daily', 'Weekly', 'Monthly', 'Overall'] as const
type Filter = (typeof FILTERS)[number]

const AMBER = '#C98A0B'
const INK = '#14161A'
const RED = '#C8362B'
const MEDALS = [
  { top: AMBER, chip: '#FFF8E8' },
  { top: '#8B96A6', chip: '#F1F4F8' },
  { top: '#B08A5A', chip: '#FBF3EA' },
]

const EMPTY_COPY: Record<Filter, string> = {
  Daily: "Nobody's cleared today's stage yet.",
  Weekly: "Nobody's posted a score this level yet.",
  Monthly: "Nobody's posted a score this month yet.",
  Overall: 'The season just started — nobody has a score yet.',
}

export default function BoardPage() {
  const [filter, setFilter] = useState<Filter>('Overall')
  const rows = useQuery(api.leaderboard.getLeaderboard, { filter })

  const [detailUser, setDetailUser] = useState<{ userId: Id<'users'>; handle: string } | null>(null)
  const breakdown = useQuery(
    api.leaderboard.getUserBreakdown,
    detailUser ? { userId: detailUser.userId, filter } : 'skip',
  )

  const filterTabs = (
    <div className="flex flex-wrap gap-4.5">
      {FILTERS.map((f) => (
        <button
          key={f}
          onClick={() => setFilter(f)}
          className="cursor-pointer border-b pb-1.5 font-mono text-[10.4px] font-medium tracking-[0.14em]"
          style={{ borderBottomColor: filter === f ? RED : 'transparent', color: filter === f ? INK : '#9A9CA1' }}
        >
          {f.toUpperCase()}
        </button>
      ))}
    </div>
  )

  const header = (
    <div className="mb-7.5 flex flex-wrap items-end justify-between gap-5">
      <div>
        <div className="mb-4 font-mono text-[10.4px] font-medium tracking-[0.2em] text-faint">
          STANDINGS · SORTED DESC BY SCORE
        </div>
        <div className="font-serif text-[34px] leading-[0.98] tracking-[-0.015em] md:text-[60px]">The board</div>
      </div>
      {filterTabs}
    </div>
  )

  if (rows === undefined) {
    const barHeights = [38, 62, 84, 100, 70, 50, 30, 18]
    return (
      <div className="mx-auto max-w-[1080px]">
        {header}
        <div className="mb-8.5 flex flex-wrap items-end gap-6 border-y border-ink/14 py-6 md:gap-11">
          <div className="min-w-0 flex-1 basis-[360px]">
            <Skel className="mb-5.5 h-3 w-56" />
            <div className="flex h-[158px] items-end gap-1.5 border-b border-ink/34">
              {barHeights.map((h, i) => (
                <Skel key={i} className="w-full" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
          <div className="min-w-[200px] flex-0 basis-[250px]">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="flex items-baseline gap-2.5 border-b border-dotted border-ink/22 py-2.5">
                <Skel className="h-3 w-24" />
                <Skel className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </div>
        <div className="mb-8.5 flex flex-wrap gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="min-w-[180px] flex-1 basis-[180px] border border-ink/18 p-5">
              <Skel className="mb-4.5 h-3 w-20" />
              <Skel className="mb-3 h-[32px] w-3/4" />
              <Skel className="mb-2 h-3 w-full" />
              <Skel className="h-3 w-full" />
            </div>
          ))}
        </div>
        {Array.from({ length: 5 }, (_, i) => (
          <SkelRow key={i} className="border-b border-dotted border-ink/20" />
        ))}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="animate-fade mx-auto max-w-[1080px]">
        {header}
        <EmptyState
          title={EMPTY_COPY[filter]}
          body="Clear a stage and your handle is the first thing anyone sees when they open this filter."
          ctaLabel="GO TO TODAY'S STAGE →"
          ctaTo="/today"
        >
          <div className="mb-1 flex items-baseline gap-2.5 border-b border-ink/30 pb-2.5 font-mono text-[9.8px] font-medium tracking-[0.16em] text-faint">
            <div className="w-9.5">#</div>
            <div className="flex-1">HANDLE</div>
            <div className="w-13.5 text-right">STREAK</div>
            <div className="w-13.5 text-right">SOLVED</div>
            <div className="w-16.5 text-right">SCORE</div>
          </div>
          <SlotRows count={3} />
        </EmptyState>
      </div>
    )
  }

  const me = rows.find((r) => r.isMe)
  const scores = rows.map((r) => r.score)
  const lo = scores.length ? Math.min(...scores) : 0
  const hi = scores.length ? Math.max(...scores) : 1
  const span = Math.max(1, hi - lo)
  const BINS = 8
  const binW = span / BINS
  const counts = Array.from({ length: BINS }, () => 0)
  rows.forEach((r) => {
    counts[Math.min(BINS - 1, Math.floor((r.score - lo) / binW))]++
  })
  const hiCount = Math.max(1, ...counts)
  const meBin = me ? Math.min(BINS - 1, Math.floor((me.score - lo) / binW)) : -1
  const kf = (v: number) => (v / 1000).toFixed(1) + 'k'

  const podium = rows.slice(0, 3)

  return (
    <div className="animate-fade mx-auto max-w-[1080px]">
      {header}

      <div className="mb-8.5 flex flex-wrap items-end gap-6 border-y border-ink/14 py-6 md:gap-11">
        <div className="min-w-0 flex-1 basis-[360px]">
          <div className="mb-5.5 font-mono text-[10.4px] font-medium tracking-[0.18em] text-faint">
            SCORE DISTRIBUTION · {rows.length} RUNNERS
          </div>
          <div className="flex h-[158px] items-end gap-1.5 border-b border-ink/34">
            {counts.map((c, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <div className="font-mono text-[10.4px]" style={{ color: i === meBin ? RED : '#9A9CA1' }}>
                  {c}
                </div>
                <div
                  className="w-full"
                  style={{
                    height: `${Math.max(4, Math.round((c / hiCount) * 100))}%`,
                    background: i === meBin ? 'rgba(200,54,43,.18)' : `rgba(201,138,11,${0.06 + (i / BINS) * 0.22})`,
                    borderTop: `2px solid ${i === meBin ? RED : AMBER}`,
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-1.5 pt-2.5">
            {counts.map((_, i) => (
              <div key={i} className="flex-1 text-center font-mono text-[9.5px] font-medium tracking-[0.04em]" style={{ color: i === meBin ? RED : '#9A9CA1' }}>
                {kf(lo + binW * i)}
              </div>
            ))}
          </div>
        </div>
        <div className="w-full md:min-w-[200px] md:w-auto md:flex-0 md:basis-[250px]">
          {[
            { k: 'YOUR SCORE', v: me ? <ScoreCell value={me.score} /> : '—', fg: RED },
            { k: 'COHORT MEDIAN', v: rows.length ? Math.round((lo + hi) / 2 / 10) * 10 : 0, fg: INK },
            { k: 'RUNNERS', v: rows.length, fg: INK },
            { k: 'SPREAD', v: `${kf(lo)}–${kf(hi)}`, fg: INK },
          ].map((d) => (
            <div key={d.k} className="flex items-baseline gap-2.5 border-b border-dotted border-ink/22 py-2.5">
              <div className="font-mono text-[10.4px] font-medium tracking-[0.14em] text-mute">{d.k}</div>
              <div className="min-w-[10px] flex-1 border-b border-dotted border-ink/26" style={{ transform: 'translateY(-4px)' }} />
              <div className="font-mono text-[19px]" style={{ color: d.fg }}>
                {d.v}
              </div>
            </div>
          ))}
          {me && (
            <div className="mt-3.5 font-sans text-[13.5px] leading-[1.6] text-mute">
              You sit at rank <strong className="text-red">{me.rank}</strong> of {rows.length}.
            </div>
          )}
        </div>
      </div>

      <div className="mb-8.5 flex flex-wrap gap-3">
        {podium.map((p, i) => (
          <div
            key={p.handle}
            onClick={() => setDetailUser({ userId: p.userId, handle: p.handle })}
            className={`min-w-[180px] flex-1 basis-[180px] cursor-pointer border border-ink/18 p-5 transition-shadow hover:shadow-[0_4px_18px_rgba(20,22,26,.1)] ${i === 0 ? 'animate-crown-glint' : ''}`}
            style={{ background: i === 0 ? '#FFFDF6' : '#FFFFFF', borderTop: `3px solid ${MEDALS[i].top}` }}
          >
            <div className="mb-4.5 flex items-start justify-between gap-3">
              <div className="font-mono text-[10.4px] font-medium tracking-[0.16em]" style={{ color: MEDALS[i].top }}>
                {['STRONGEST', 'SECOND', 'THIRD'][i]}
              </div>
              <div
                className="flex h-7.5 w-7.5 items-center justify-center rounded-full border font-mono text-[10.4px]"
                style={{ background: MEDALS[i].chip, borderColor: MEDALS[i].top }}
              >
                {p.rank}
              </div>
            </div>
            <div className="mb-3 overflow-hidden text-ellipsis whitespace-nowrap font-serif text-[25px] md:text-[32px]">{p.handle}</div>
            <Row k="SCORE" v={<ScoreCell value={p.score} />} />
            <Row k="STREAK" v={`${p.currentStreak}d`} />
          </div>
        ))}
      </div>

      <div className="flex items-baseline gap-2.5 border-b border-ink/30 pb-2.5 font-mono text-[9.8px] font-medium tracking-[0.16em] text-faint">
        <div className="w-9.5">#</div>
        <div className="flex-1">HANDLE</div>
        <div className="w-13.5 text-right">STREAK</div>
        <div className="w-13.5 text-right">SOLVED</div>
        <div className="w-16.5 text-right">SCORE</div>
      </div>
      {rows.map((r) => (
        <div
          key={r.handle}
          onClick={() => setDetailUser({ userId: r.userId, handle: r.handle })}
          className="flex cursor-pointer items-baseline gap-2.5 border-b border-dotted border-ink/20 py-3 transition-colors hover:bg-ink/[.03]"
          style={{ background: r.isMe ? 'rgba(200,54,43,.05)' : 'transparent' }}
        >
          <div className="w-9.5 font-mono text-[11.5px] text-faint">[{String(r.rank).padStart(2, '0')}]</div>
          <div className="min-w-0 flex-1">
            <div className="overflow-hidden text-ellipsis whitespace-nowrap font-sans text-[17.3px] font-medium" style={{ color: r.isMe ? RED : INK }}>
              {r.handle}
            </div>
          </div>
          <div className="w-13.5 text-right font-mono text-[12.6px]" style={{ color: r.currentStreak >= 7 ? '#0A7A52' : '#6E7178' }}>
            {r.currentStreak}d
          </div>
          <div className="w-13.5 text-right font-mono text-[12.6px] text-mute">{r.solved}</div>
          <ScoreCell value={r.score} className="w-16.5 text-right font-mono text-[19.5px]" />
        </div>
      ))}

      {detailUser && (
        <ScoreBreakdownModal
          handle={detailUser.handle}
          mode={filter === 'Daily' ? 'daily' : 'aggregate'}
          rows={breakdown === undefined ? undefined : breakdown === null ? null : breakdown.submissions}
          onClose={() => setDetailUser(null)}
        />
      )}
    </div>
  )
}

function Row({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex items-baseline gap-2 py-0.5">
      <div className="font-mono text-[9.8px] font-medium tracking-[0.12em] text-mute">{k}</div>
      <div className="min-w-[10px] flex-1 border-b border-dotted border-ink/26" style={{ transform: 'translateY(-4px)' }} />
      <div className="font-mono text-[15px]">{v}</div>
    </div>
  )
}
