import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { todayLocalStr } from '../lib/date'
import { useToast } from '../lib/toastContext'
import { Skel, SkelLines, SkelRow } from '../components/Skeleton'
import { EmptyState } from '../components/EmptyState'
import { ScoreBreakdownModal } from '../components/ScoreBreakdown'
import { ScoreCell } from '../components/ScoreCell'

export default function RevealPage({ weekNumber }: { weekNumber?: number }) {
  const weeks = useQuery(api.syllabus.listWeeks)
  const flash = useToast()

  const today = todayLocalStr()
  const resolvedWeek =
    weekNumber ?? (weeks ? [...weeks].reverse().find((w) => w.endDate < today)?.weekNumber ?? weeks[0]?.weekNumber : undefined)

  const reveal = useQuery(api.leaderboard.getWeekReveal, resolvedWeek !== undefined ? { weekNumber: resolvedWeek } : 'skip')

  const [detailUser, setDetailUser] = useState<{ userId: Id<'users'>; handle: string } | null>(null)
  const breakdown = useQuery(
    api.leaderboard.getUserWeekBreakdown,
    detailUser && resolvedWeek !== undefined ? { userId: detailUser.userId, weekNumber: resolvedWeek } : 'skip',
  )

  const hero = (
    <div className="mb-8.5 flex flex-wrap items-end gap-6 border-b border-ink/14 pb-8 md:gap-12">
      <div className="min-w-0 flex-1 basis-[320px]">
        <div className="font-serif text-[40px] leading-[0.9] tracking-[-0.02em] md:text-[76px]">
          The week,
          <br />
          <em className="italic text-red">revealed.</em>
        </div>
      </div>
      {reveal && (
        <div className="min-w-0 flex-1 basis-[260px] font-sans text-[17.3px] leading-[1.7] text-mute md:text-[19.5px]">
          {reveal.weekBoard.length > 0
            ? `${reveal.runnersWhoFinished} of ${reveal.totalRunners} runners took all seven stages. Cohort average percentile this level: ${reveal.cohortAvgPercentile.toFixed(1)}.`
            : `Level ${String(reveal.week.weekNumber).padStart(2, '0')} just opened. This page fills in as runners clear stages.`}
        </div>
      )}
    </div>
  )

  if (weeks === undefined || resolvedWeek === undefined || reveal === undefined) {
    return (
      <div className="animate-fade mx-auto max-w-[1080px]">
        {hero}
        <div className="mb-8.5 flex flex-wrap gap-6 md:gap-10">
          {[0, 1].map((i) => (
            <div key={i} className="min-w-0 flex-1 basis-[260px] border-t-2 border-ink/14 pt-4.5">
              <div className="mb-4.5 flex items-center gap-3">
                <Skel className="h-8.5 w-8.5 rounded-full" />
                <Skel className="h-3 w-32" />
              </div>
              <Skel className="mb-3.5 h-[30px] w-2/3" />
              <Skel className="h-3 w-1/2" />
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-start gap-6 md:gap-11">
          <div className="min-w-0 flex-1 basis-[360px]">
            <Skel className="mb-5 h-[28px] w-1/2" />
            {Array.from({ length: 4 }, (_, i) => (
              <SkelRow key={i} className="border-b border-ink/10" />
            ))}
          </div>
          <div className="min-w-0 flex-1 basis-[260px]">
            <Skel className="mb-5 h-[28px] w-2/3" />
            <SkelLines count={4} lastWidth="w-1/3" />
          </div>
        </div>
      </div>
    )
  }
  if (reveal === null) return <div className="font-sans text-mute">No reveal for that level yet.</div>

  const { week, weekBoard, topPerformer, mostImproved, hardest, runnersWhoFinished, totalRunners, cohortAvgPercentile } = reveal
  const isClosed = week.endDate < today
  const hasData = weekBoard.length > 0

  return (
    <div className="animate-fade mx-auto max-w-[1080px]">
      <div className="mb-5.5 flex items-center gap-3">
        <div className="font-mono text-[10.4px] font-medium tracking-[0.2em] text-red">
          LEVEL {String(week.weekNumber).padStart(2, '0')} {isClosed ? 'CLOSED' : 'IN PROGRESS'} · {week.topic.toUpperCase()}
        </div>
        <div className="flex-1 border-b border-ink/16" />
      </div>

      {hero}

      {!hasData ? (
        <EmptyState
          bordered={false}
          title={
            <>
              Nobody's cleared a stage in <em className="italic text-red">{week.topic}</em> yet.
            </>
          }
          body="Once the first submission lands, the strongest runner, the biggest climber, and the full level leaderboard show up right here."
          ctaLabel="GO TO TODAY'S STAGE →"
          ctaTo="/today"
        />
      ) : (
        <>
          <div className="mb-8.5 flex flex-wrap gap-6 md:gap-10">
            <div className="min-w-0 flex-1 basis-[260px] border-t-2 pt-4.5" style={{ borderTopColor: '#C98A0B' }}>
              <div className="mb-4.5 flex items-center gap-3">
                <div className="flex h-8.5 w-8.5 items-center justify-center rounded-full border border-ink" style={{ background: '#FFF8E8' }} />
                <div className="font-mono text-[10.4px] font-medium tracking-[0.16em] text-mute">STRONGEST OF THE WEEK</div>
              </div>
              <div className="mb-3.5 font-serif text-[29.9px] leading-[1.05] md:text-[34px]">{topPerformer?.handle ?? '—'}</div>
              {topPerformer && (
                <div className="mb-3.5 font-mono text-[10.4px] font-medium tracking-[0.12em] text-mute">
                  {topPerformer.stages} / 7 CLEARED · SCORE {Math.round(topPerformer.score)}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 basis-[260px] border-t-2 pt-4.5" style={{ borderTopColor: '#1D4ED8' }}>
              <div className="mb-4.5 flex items-center gap-3">
                <div className="flex h-8.5 w-8.5 items-center justify-center rounded-full border border-ink font-mono" style={{ background: '#F1F4FF' }}>
                  ↑
                </div>
                <div className="font-mono text-[10.4px] font-medium tracking-[0.16em] text-mute">BIGGEST CLIMB</div>
              </div>
              <div className="mb-3.5 font-serif text-[29.9px] leading-[1.05] md:text-[34px]">{mostImproved?.handle ?? 'Nobody yet'}</div>
              {mostImproved && (
                <div className="mb-3.5 font-mono text-[10.4px] font-medium tracking-[0.12em] text-mute">
                  +{mostImproved.deltaPercentile.toFixed(1)} AVG PERCENTILE VS BEFORE THIS LEVEL
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-start gap-6 md:gap-11">
            <div className="min-w-0 flex-1 basis-[360px]">
              <div className="mb-5 flex items-baseline justify-between gap-3">
                <div className="font-serif text-[28px]">The week's leaderboard</div>
                <div className="font-mono text-[10.4px] font-medium tracking-[0.14em] text-faint">
                  LEVEL {String(week.weekNumber).padStart(2, '0')} ONLY
                </div>
              </div>
              <div className="flex items-baseline gap-2.5 border-b border-ink/30 pb-2.5 font-mono text-[9.8px] font-medium tracking-[0.16em] text-faint">
                <div className="w-8.5">#</div>
                <div className="flex-1">HANDLE</div>
                <div className="w-13 text-right">STAGES</div>
                <div className="w-15 text-right">SCORE</div>
              </div>
              {weekBoard.map((r) => (
                <div
                  key={r.handle}
                  onClick={() => setDetailUser({ userId: r.userId, handle: r.handle })}
                  className="flex cursor-pointer items-center gap-2.5 border-b border-ink/10 py-3 transition-colors hover:bg-ink/[.03]"
                  style={{ background: r.isMe ? 'rgba(200,54,43,.05)' : 'transparent' }}
                >
                  <div className="flex h-7.5 w-8.5 shrink-0 items-center justify-center border border-ink/24 font-mono text-[12px]">{r.rank}</div>
                  <div className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-sans text-[16px] font-medium" style={{ color: r.isMe ? '#C8362B' : '#14161A' }}>
                    {r.handle}
                  </div>
                  <div className="w-13 text-right font-mono text-[12.5px] text-mute">{r.stages}/7</div>
                  <ScoreCell value={Math.round(r.score)} className="w-15 text-right font-mono text-[17px]" />
                </div>
              ))}

              {detailUser && (
                <ScoreBreakdownModal
                  handle={detailUser.handle}
                  mode="aggregate"
                  rows={breakdown === undefined ? undefined : breakdown === null ? null : breakdown.submissions}
                  onClose={() => setDetailUser(null)}
                />
              )}
            </div>

            <div className="min-w-0 flex-1 basis-[260px]">
              <div className="mb-5 font-serif text-[28px]">The week in numbers</div>
              {[
                { k: 'RUNNERS WHO TOOK ALL SEVEN', v: `${runnersWhoFinished} / ${totalRunners}` },
                { k: 'COHORT AVG PERCENTILE', v: cohortAvgPercentile.toFixed(1) },
                { k: 'PERFECT WEEKS', v: String(weekBoard.filter((r) => r.stages === 7).length) },
              ].map((r) => (
                <div key={r.k} className="flex items-baseline gap-2.5 border-b border-dotted border-ink/22 py-3">
                  <div className="font-mono text-[10.4px] font-medium tracking-[0.13em] text-mute">{r.k}</div>
                  <div className="min-w-[10px] flex-1 border-b border-dotted border-ink/26" style={{ transform: 'translateY(-4px)' }} />
                  <div className="font-mono text-[20px]">{r.v}</div>
                </div>
              ))}
              {hardest && (
                <div className="mt-4.5 font-sans text-[14.5px] leading-[1.7] text-mute">
                  Hardest stage of the week: <strong>{hardest.title}</strong> — a {hardest.avg.toFixed(1)} cohort average.
                </div>
              )}
              <button
                onClick={() => {
                  void navigator.clipboard?.writeText(window.location.href)
                  flash('RECAP LINK COPIED')
                }}
                className="mt-5.5 w-full cursor-pointer bg-ink px-4.5 py-3.5 text-center font-mono text-[11px] font-medium tracking-[0.18em] text-ground hover:bg-red"
              >
                COPY THE WEEK RECAP →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
