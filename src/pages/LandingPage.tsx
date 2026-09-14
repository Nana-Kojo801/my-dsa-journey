import { Link } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { todayLocalStr } from '../lib/date'
import { SlotRows } from '../components/EmptyState'
import { SkelRow } from '../components/Skeleton'

const STORY = [
  { n: '01 · LEARN', c: '#C8362B', h: 'A level opens every Monday', b: 'A written briefing with the pattern spelled out, then seven stages that escalate from warm-up to the one that actually hurts.' },
  { n: '02 · PROVE', c: '#1D4ED8', h: 'The screenshot is the evidence', b: 'Runtime and memory, read straight off the results panel and turned into a score. The image itself is discarded on read.' },
  { n: '03 · CLIMB', c: '#0A7A52', h: "Sunday closes the level", b: "The reveal names the week's strongest and the biggest climber, and hands you a plotted recap of your own seven stages." },
]

export default function LandingPage() {
  const today = todayLocalStr()
  const ctx = useQuery(api.syllabus.getTodayContext, { today })
  const board = useQuery(api.leaderboard.getLeaderboard, { filter: 'Weekly' })
  const bounds = useQuery(api.syllabus.getSeasonBounds)

  const weekNumber = ctx?.week?.weekNumber
  const totalWeeks = bounds?.last?.weekNumber ?? 17

  return (
    <div className="animate-fade min-h-screen bg-graph">
      <div className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-ink/14 bg-ground/92 px-4 py-3.5 backdrop-blur md:px-10">
        <div className="font-mono text-[11.5px] font-medium tracking-[0.2em]">DSA&nbsp;JOURNEY</div>
        <Link to="/auth" className="cursor-pointer bg-ink px-3.5 py-2.5 font-mono text-[10.9px] font-medium tracking-[0.16em] text-ground no-underline hover:bg-red">
          ENTER →
        </Link>
      </div>

      <div className="flex flex-wrap items-end gap-8 border-b border-ink/14 px-4 py-9 md:gap-13.5 md:px-10 md:py-16">
        <div className="min-w-0 flex-1 basis-[340px]">
          <div className="mb-6 font-mono text-[10.4px] font-medium tracking-[0.2em] text-mute">
            {weekNumber ? `LEVEL ${String(weekNumber).padStart(2, '0')} OF ${totalWeeks} · ${ctx?.week?.topic.toUpperCase()}` : 'SEASON 01'}
          </div>
          <div className="mb-6.5 font-serif text-[46px] leading-[0.9] tracking-[-0.02em] md:text-[88px]">
            A four-month
            <br />
            run through
            <br />
            every structure
            <br />
            <em className="italic text-red">that matters.</em>
          </div>
          <div className="mb-7.5 max-w-[48ch] font-sans text-[17.3px] leading-[1.65] text-mute md:text-[20.7px]">
            One topic a week, seven problems a day apart. Upload the accepted submission and the numbers get pulled
            straight off it — then you're on the board.
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/auth" className="flex cursor-pointer items-center gap-3 bg-ink px-5 py-3.5 font-mono text-[11.5px] font-medium tracking-[0.18em] text-ground no-underline hover:bg-red">
              TAKE A HANDLE →
            </Link>
            <Link to="/tree" className="cursor-pointer border border-ink/28 px-5 py-3.5 font-mono text-[11.5px] font-medium tracking-[0.18em] text-ink no-underline hover:border-ink">
              VIEW THE TREE
            </Link>
          </div>
        </div>

        <div className="min-w-0 flex-1 basis-[320px] self-start">
          <div className="mb-4.5 flex items-center justify-between gap-3">
            <div className="font-mono text-[10.4px] font-medium tracking-[0.18em] text-mute">LIVE STANDINGS · THIS WEEK</div>
          </div>
          {board === undefined ? (
            <div className="border-t border-ink/30">
              {Array.from({ length: 4 }, (_, i) => (
                <SkelRow key={i} className="border-b border-ink/10" />
              ))}
            </div>
          ) : board.length > 0 ? (
            <>
              <div className="flex flex-col border-t border-ink/30">
                {board.slice(0, 6).map((r) => (
                  <div key={r.rank} className="flex items-center gap-3.5 border-b border-ink/10 py-3.5 pr-2.5">
                    <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center border border-ink/24 font-mono text-[13px]">
                      {String(r.rank).padStart(2, '0')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="overflow-hidden text-ellipsis whitespace-nowrap font-sans text-[17px] font-medium">{r.handle}</div>
                      <div className="mt-1.5 font-mono text-[10px] font-medium tracking-[0.1em] text-faint">
                        {r.currentStreak}d STREAK · {r.solved} SOLVED
                      </div>
                    </div>
                    <div className="font-mono text-[19px]">{r.score.toLocaleString()}</div>
                  </div>
                ))}
              </div>
              <Link to="/auth" className="mt-4 inline-block cursor-pointer font-mono text-[10.4px] font-medium tracking-[0.16em] text-red no-underline">
                FULL BOARD →
              </Link>
            </>
          ) : (
            <div className="border-t border-ink/30">
              <SlotRows count={3} />
              <div className="py-5">
                <div className="mb-3 font-serif text-[22px] leading-[1.2]">
                  Nobody's posted a score <em className="italic text-red">this week.</em>
                </div>
                <div className="mb-4.5 font-sans text-[14.5px] leading-[1.6] text-mute">
                  Clear today's stage and your handle takes rank 01 — first name on a blank board.
                </div>
                <Link to="/auth" className="inline-flex cursor-pointer items-center gap-2.5 bg-ink px-4 py-3 font-mono text-[10.9px] font-medium tracking-[0.18em] text-ground no-underline hover:bg-red">
                  BE THE FIRST →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3">
        {STORY.map((s) => (
          <div key={s.n} className="border-b border-ink/14 p-6 md:border-r md:p-10.5">
            <div className="mb-5 font-mono text-[10.4px] font-medium tracking-[0.2em]" style={{ color: s.c }}>
              {s.n}
            </div>
            <div className="mb-3 font-serif text-[29.9px] leading-[1.1]">{s.h}</div>
            <div className="font-sans text-[16.1px] leading-[1.65] text-mute">{s.b}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-5.5 px-4 py-10 md:px-10 md:py-13.5">
        <div className="font-serif text-[29.9px] leading-[1.05] md:text-[44px]">
          The next level opens Monday.
          <br />
          <em className="italic text-red">Start at the root.</em>
        </div>
        <Link to="/auth" className="cursor-pointer bg-ink px-5 py-3.5 font-mono text-[11.5px] font-medium tracking-[0.18em] text-ground no-underline hover:bg-red">
          CREATE A HANDLE →
        </Link>
      </div>
    </div>
  )
}
