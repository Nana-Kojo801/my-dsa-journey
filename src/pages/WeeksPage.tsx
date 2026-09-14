import { Link } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { todayLocalStr } from '../lib/date'
import { useToast } from '../lib/toastContext'
import { Skel } from '../components/Skeleton'
import { stripMarkdown } from '../lib/stripMarkdown'

export default function WeeksPage() {
  const weeks = useQuery(api.syllabus.listWeeks)
  const history = useQuery(api.submissions.getMyHistory)
  const flash = useToast()
  const today = todayLocalStr()

  const totalStages = weeks ? weeks.length * 7 : undefined
  const cleared = history?.length
  const solvedByWeek = new Map<number, number>()
  for (const h of history ?? []) {
    if (h.question) solvedByWeek.set(h.question.weekNumber, (solvedByWeek.get(h.question.weekNumber) ?? 0) + 1)
  }

  const currentWeek = weeks?.find((w) => w.startDate <= today && today <= w.endDate)
  const depth = currentWeek ? Math.ceil(currentWeek.weekNumber / 4) : undefined

  return (
    <div className="animate-fade mx-auto max-w-[1080px]">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="mb-4 font-mono text-[10.4px] font-medium tracking-[0.2em] text-faint">
            CURRICULUM{weeks ? ` · ${weeks.length} LEVELS · ${totalStages} STAGES` : ''}
          </div>
          <div className="font-serif text-[34px] leading-[0.98] tracking-[-0.015em] md:text-[60px]">The season tree</div>
        </div>
        <div className="flex flex-wrap gap-5">
          <div>
            <div className="mb-2 font-mono text-[10.4px] font-medium tracking-[0.16em] text-faint">CLEARED</div>
            <div className="font-mono text-[29.9px]">
              {cleared === undefined || totalStages === undefined ? (
                '—'
              ) : (
                <>
                  {cleared}
                  <span className="text-faint">/{totalStages}</span>
                </>
              )}
            </div>
          </div>
          <div>
            <div className="mb-2 font-mono text-[10.4px] font-medium tracking-[0.16em] text-faint">DEPTH</div>
            <div className="font-mono text-[29.9px] text-red">
              {depth === undefined || weeks === undefined ? (
                '—'
              ) : (
                <>
                  {depth}
                  <span className="text-faint">/{Math.ceil(weeks.length / 4)}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {weeks === undefined ? (
        <div className="mx-auto flex max-w-[430px] flex-col gap-6 py-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="border border-ink/18 border-t-2 border-t-ink/14 px-5 py-4.5" style={{ marginLeft: i % 2 === 1 ? 'auto' : 0 }}>
              <Skel className="mb-2.5 h-2.5 w-24" />
              <Skel className="mb-2 h-[21px] w-3/4 md:h-[26px]" />
              <Skel className="mb-1.5 h-2.5 w-full" />
              <Skel className="h-2.5 w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="mb-1 flex justify-center">
            <div className="border border-ink/20 bg-paper px-3 py-1.5 font-mono text-[10.4px] font-medium tracking-[0.2em] text-faint">
              ROOT · WEEK 01
            </div>
          </div>

          {weeks.map((w, i) => {
            const right = i % 2 === 1
            const isCurrent = w.weekNumber === currentWeek?.weekNumber
            const solved = solvedByWeek.get(w.weekNumber) ?? 0
            const status = w.endDate < today ? 'cleared' : isCurrent ? 'current' : 'locked'
            const accent = status === 'cleared' ? '#14161A' : status === 'current' ? '#C8362B' : 'rgba(20,22,26,.18)'
            const locked = status === 'locked'

            const sideClass = right ? 'md:col-start-3 md:justify-start md:text-left' : 'md:col-start-1 md:justify-end md:text-right'

            return (
              <div
                key={w._id}
                className="grid grid-cols-[22px_minmax(0,1fr)] md:grid-cols-[minmax(0,1fr)_clamp(40px,5vw,68px)_minmax(0,1fr)]"
              >
                <div className="relative col-start-1 row-start-1 flex items-center justify-center md:col-start-2">
                  <div className="absolute inset-y-0 left-1/2 w-[3px] -ml-[1.5px]" style={{ background: w.weekNumber <= (currentWeek?.weekNumber ?? 1) ? '#14161A' : 'rgba(20,22,26,.18)' }} />
                  {/* mobile: spine always connects rightward to the single-column card */}
                  <div className="absolute top-1/2 left-1/2 right-0 h-[3px] -mt-[1.5px] md:hidden" style={{ background: accent }} />
                  {/* desktop: connects toward whichever side the card sits on */}
                  <div className="absolute top-1/2 hidden h-[3px] -mt-[1.5px] md:block" style={{ left: right ? '50%' : '0', right: right ? '0' : '50%', background: accent }} />
                  <div className="relative h-[15px] w-[15px] rounded-full border-2" style={{ background: status === 'cleared' ? '#14161A' : status === 'current' ? '#C8362B' : '#FBFBF8', borderColor: accent }} />
                </div>
                <div className={`col-start-2 row-start-1 flex items-center justify-start py-2.5 text-left ${sideClass}`}>
                  {locked ? (
                    <div
                      onClick={() => flash(`LEVEL ${w.weekNumber} OPENS LATER IN THE SEASON`)}
                      className="relative w-full max-w-[430px] cursor-pointer border border-ink/18 bg-transparent px-4 py-4 border-t-2 md:px-5 md:py-4.5"
                      style={{ borderTopColor: accent }}
                    >
                      <LevelCard w={w} right={right} status={status} solved={solved} isCurrent={false} />
                    </div>
                  ) : (
                    <Link
                      to={`/level/${w.weekNumber}`}
                      className="relative w-full max-w-[430px] cursor-pointer border bg-transparent px-4 py-4 border-t-2 no-underline hover:border-ink md:px-5 md:py-4.5"
                      style={{ borderColor: isCurrent ? 'rgba(200,54,43,.45)' : 'rgba(20,22,26,.18)', borderTopColor: accent, background: isCurrent ? '#FFFDF6' : '#FFFFFF' }}
                    >
                      <LevelCard w={w} right={right} status={status} solved={solved} isCurrent={isCurrent} />
                    </Link>
                  )}
                </div>
              </div>
            )
          })}

          <div className="mt-1 flex justify-center">
            <div className="border border-ink/20 bg-paper px-3 py-1.5 font-mono text-[10.4px] font-medium tracking-[0.2em] text-faint">
              LEAF · WEEK {weeks.length}
            </div>
          </div>
        </>
      )}

      <div className="mt-7 flex flex-wrap justify-center gap-5.5 border-t border-ink/14 pt-5">
        <Legend color="#14161A" label="STAGE CLEARED" />
        <Legend color="#C8362B" label="IN PROGRESS" />
        <Legend color="#FFFFFF" border label="NOT OPEN YET" />
      </div>
    </div>
  )
}

function LevelCard({
  w,
  right,
  status,
  solved,
  isCurrent,
}: {
  w: { weekNumber: number; topic: string; explanation: string }
  right: boolean
  status: 'cleared' | 'current' | 'locked'
  solved: number
  isCurrent: boolean
}) {
  return (
    <div>
      {isCurrent && (
        <div className="absolute -top-3 left-3.5 bg-red px-2 py-0.5 font-mono text-[9.5px] font-medium leading-[1.35] tracking-[0.12em] text-ground">
          YOU ARE HERE
        </div>
      )}
      <div className={`mb-2.5 flex items-center justify-start gap-2.5 ${right ? '' : 'md:justify-end'}`}>
        <div className="font-mono text-[10.4px] font-medium tracking-[0.16em] text-faint">LEVEL {String(w.weekNumber).padStart(2, '0')}</div>
        <div className="w-3.5 border-b border-dotted border-ink/30" />
        <div
          className="font-mono text-[10.4px] font-medium tracking-[0.14em]"
          style={{ color: status === 'cleared' ? '#0A7A52' : status === 'current' ? '#C8362B' : '#9A9CA1' }}
        >
          {status === 'cleared' ? 'CLEARED' : status === 'current' ? 'IN PROGRESS' : `OPENS WEEK ${String(w.weekNumber).padStart(2, '0')}`}
        </div>
      </div>
      <div className="mb-2 font-serif text-[21px] leading-[1.12] md:text-[26px]" style={{ color: status === 'locked' ? '#6E7178' : '#14161A' }}>
        {w.topic}
      </div>
      <div className="font-sans text-[14.5px] leading-[1.6]" style={{ color: status === 'locked' ? '#8A8D93' : '#44474D' }}>
        {stripMarkdown(w.explanation).slice(0, 110)}…
      </div>
      <div className={`mt-3.5 flex justify-start gap-1 ${right ? '' : 'md:justify-end'}`}>
        {Array.from({ length: 7 }, (_, c) => (
          <div key={c} className="h-1.5 w-[18px]" style={{ background: c < solved ? (status === 'current' ? '#C8362B' : '#14161A') : '#FFFFFF', border: c < solved ? 'none' : '1px solid rgba(20,22,26,.25)' }} />
        ))}
      </div>
    </div>
  )
}

function Legend({ color, label, border = false }: { color: string; label: string; border?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-3 w-3" style={{ background: color, border: border ? '1px solid rgba(20,22,26,.3)' : 'none' }} />
      <div className="font-mono text-[10px] font-medium tracking-[0.12em] text-mute">{label}</div>
    </div>
  )
}
