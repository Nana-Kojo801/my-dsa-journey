import { Link } from 'react-router-dom'
import type { Doc } from '../../../convex/_generated/dataModel'
import { Skel } from '../../components/Skeleton'
import { MonoLabel } from '../../components/ui'
import { levelColor } from '../../lib/levelColor'

const pad = (n: number) => String(n).padStart(2, '0')

export function StageHeader({
  question,
  week,
  isToday,
  countdown,
  cohortCount,
}: {
  question: Doc<'questions'> | null | undefined
  week: Doc<'weeks'> | null | undefined
  isToday: boolean
  countdown: { hours: number; minutes: number; seconds: number }
  cohortCount: number | undefined
}) {
  return (
    <div className="mb-7 flex flex-wrap gap-6 border-b border-ink/14 pb-7 md:gap-11">
      <div className="min-w-0 flex-1 basis-[320px]">
        {question === undefined ? (
          <div>
            <Skel className="mb-4.5 h-3 w-48" />
            <Skel className="mb-5 h-[34px] w-[80%] md:h-[56px]" />
            <Skel className="h-3 w-32" />
          </div>
        ) : (
          question && (() => {
            const color = levelColor(question.weekNumber)
            return (
              <>
                <div className="mb-4.5 flex flex-wrap items-center gap-2.5">
                  <Link
                    to={`/level/${question.weekNumber}`}
                    className="cursor-pointer border-b pb-0.5 font-mono text-[10.4px] font-medium tracking-[0.16em] no-underline"
                    style={{ borderColor: `${color}59`, color }}
                  >
                    LV {String(question.weekNumber).padStart(2, '0')} · {week?.topic.toUpperCase()}
                  </Link>
                  <div className="font-mono text-[10.4px] font-medium tracking-[0.16em] text-faint">
                    STAGE {question.dayNumber} / 7
                  </div>
                </div>
                <h1 className="mb-5 font-serif text-[34px] leading-[0.98] tracking-[-0.015em] md:text-[56px]">{question.title}</h1>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="h-1.5 w-1.5"
                      style={{ background: question.difficulty === 'Easy' ? '#0A7A52' : question.difficulty === 'Medium' ? '#C98A0B' : '#C8362B' }}
                    />
                    <div className="font-mono text-[10.4px] font-medium tracking-[0.14em] text-mute">
                      {question.difficulty.toUpperCase()}
                    </div>
                  </div>
                  <a
                    href={question.url}
                    target="_blank"
                    rel="noreferrer"
                    className="cursor-pointer border border-ink/30 px-3 py-2 font-mono text-[10.4px] font-medium tracking-[0.14em] text-ink no-underline transition-colors hover:border-red hover:text-red"
                  >
                    OPEN ON LEETCODE ↗
                  </a>
                  <Link
                    to={`/level/${question.weekNumber}`}
                    className="cursor-pointer border px-3 py-2 font-mono text-[10.4px] font-medium tracking-[0.14em] no-underline transition-colors hover:bg-[var(--lvl)] hover:text-ground"
                    style={{ borderColor: `${color}66`, color, ['--lvl' as string]: color }}
                  >
                    READ THE BRIEFING →
                  </Link>
                </div>
              </>
            )
          })()
        )}
      </div>
      {isToday && (
        <div className="flex flex-1 basis-[210px] flex-col justify-center gap-2 border-l-2 border-red bg-[#FFF6F5] px-5 py-4.5">
          <MonoLabel className="text-red">STAGE CLOSES IN</MonoLabel>
          <div className="font-mono text-[38px] leading-none tracking-[-0.02em] md:text-[50px]">
            {pad(countdown.hours)}
            <span className="ml-0.5 mr-2 font-sans text-[0.3em] font-medium tracking-[0.06em] text-faint" style={{ verticalAlign: '0.3em' }}>
              H
            </span>
            {pad(countdown.minutes)}
            <span className="ml-0.5 mr-2 font-sans text-[0.3em] font-medium tracking-[0.06em] text-faint" style={{ verticalAlign: '0.3em' }}>
              M
            </span>
            <span className="text-faint">
              {pad(countdown.seconds)}
              <span className="ml-0.5 font-sans text-[0.3em] font-medium tracking-[0.06em]" style={{ verticalAlign: '0.3em' }}>
                S
              </span>
            </span>
          </div>
          <div className="font-sans text-[13.2px] leading-[1.5] text-mute">
            {cohortCount === undefined
              ? 'Counting today’s clears…'
              : `${cohortCount} runner${cohortCount === 1 ? '' : 's'} ${cohortCount === 1 ? 'has' : 'have'} cleared it today.`}
          </div>
        </div>
      )}
    </div>
  )
}
