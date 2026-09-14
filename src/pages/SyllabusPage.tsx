import { Link } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { todayLocalStr, formatPretty } from '../lib/date'
import { GLYPH } from '../lib/glyphs'
import { Skel, SkelLines, SkelStepper } from '../components/Skeleton'
import { Prose } from '../lib/markdown'
import type { Doc } from '../../convex/_generated/dataModel'

export default function SyllabusPage({ weekNumber }: { weekNumber: number }) {
  const week = useQuery(api.syllabus.getWeek, { weekNumber })
  const questions = useQuery(api.syllabus.getQuestionsForWeek, { weekNumber })
  const mySubs = useQuery(api.submissions.getMySubmissionsForWeek, { weekNumber })

  const today = todayLocalStr()
  const subByQuestion = new Map((mySubs ?? []).map((s) => [s.questionId, s]))
  const cleared = mySubs?.length

  if (week === null) {
    return (
      <div className="mx-auto max-w-[900px]">
        <Link to="/weeks" className="mb-6 inline-block cursor-pointer font-mono text-[10.4px] font-medium tracking-[0.18em] text-mute no-underline">
          ← BACK TO THE TREE
        </Link>
        <div className="font-sans text-mute">That level doesn't exist yet.</div>
      </div>
    )
  }

  const current = questions?.find((q) => q.date === today) ?? null

  return (
    <div className="animate-fade mx-auto max-w-[900px]">
      <Link to="/weeks" className="mb-6 inline-block cursor-pointer font-mono text-[10.4px] font-medium tracking-[0.18em] text-mute no-underline">
        ← BACK TO THE TREE
      </Link>

      <div className="mb-6.5 flex flex-wrap items-end gap-6 border-b border-ink/14 pb-6.5">
        <div className="min-w-0 flex-1 basis-[300px]">
          <div className="mb-4 font-mono text-[10.4px] font-medium tracking-[0.2em] text-faint">
            LEVEL {String(weekNumber).padStart(2, '0')}
            {week && <> · WEEK OF {formatPretty(week.startDate)}</>}
          </div>
          {week === undefined ? (
            <Skel className="h-[38px] w-[65%] md:h-[60px]" />
          ) : (
            <div className="font-serif text-[38px] leading-[0.96] tracking-[-0.015em] md:text-[60px]">{week.topic}</div>
          )}
        </div>
        <div className="flex-0 basis-[240px]">
          <div className="mb-2 flex items-baseline justify-between">
            <div className="font-mono text-[10.4px] font-medium tracking-[0.16em] text-faint">CLEARED</div>
            <div className="font-mono text-[12.6px]">{cleared === undefined ? '—' : `${cleared} / 7`}</div>
          </div>
          <div className="flex gap-[3px]">
            {(questions ?? Array.from({ length: 7 })).map((q, i) => (
              <div
                key={q?._id ?? i}
                className="h-[9px] flex-1"
                style={{
                  background: q && subByQuestion.has(q._id) ? '#14161A' : '#FFFFFF',
                  border: q && subByQuestion.has(q._id) ? 'none' : '1px solid rgba(20,22,26,.2)',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-3">
        {questions === undefined ? (
          <SkelStepper />
        ) : (
          <>
            <div className="flex items-center gap-1">
              {questions.map((q, i) => {
                const sub = subByQuestion.get(q._id)
                const done = sub !== undefined
                const isToday = q.date === today
                const reachable = done || q.date <= today
                return (
                  <div key={q._id} className="flex items-center">
                    {i > 0 && <div className="h-px w-3 md:w-5" style={{ background: done ? '#14161A' : 'rgba(20,22,26,.16)' }} />}
                    <Link
                      to={reachable ? `/question/${q._id}` : '#'}
                      title={`Stage ${q.dayNumber} · ${q.title}`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] no-underline"
                      style={{
                        borderColor: done ? '#14161A' : isToday ? '#C8362B' : 'rgba(20,22,26,.28)',
                        background: done ? '#14161A' : isToday ? '#C8362B' : '#FBFBF8',
                        color: done || isToday ? '#FBFBF8' : reachable ? '#44474D' : '#9A9CA1',
                        cursor: reachable ? 'pointer' : 'default',
                      }}
                    >
                      {done ? GLYPH.cleared : q.dayNumber}
                    </Link>
                  </div>
                )
              })}
            </div>
            {current && (
              <Link
                to={`/question/${current._id}`}
                className="flex items-center gap-2.5 font-mono text-[10.9px] font-medium tracking-[0.14em] text-red no-underline"
              >
                STAGE {current.dayNumber} · {current.title.toUpperCase()} · OPEN →
              </Link>
            )}
          </>
        )}
      </div>

      <div className="mb-6 font-mono text-[10.4px] font-medium tracking-[0.2em] text-faint">THE BRIEFING</div>
      {week === undefined ? (
        <SkelLines count={5} lastWidth="w-1/2" className="mb-6" />
      ) : (
        <Prose content={week.explanation} className="mb-6 font-sans text-[18.4px] leading-[1.7] text-[#2C2F35]" />
      )}

      <div className="mb-2 bg-ink p-5 text-ground">
        <div className="mb-4 font-mono text-[9.8px] font-medium tracking-[0.2em] text-[#8E9197]">THE SHAPE OF EVERY SOLUTION</div>
        {week === undefined ? (
          <SkelLines count={5} lastWidth="w-1/3" dark />
        ) : (
          <pre className="overflow-x-auto whitespace-pre font-mono text-[14.5px] leading-[1.8]">{week.codeSnippet}</pre>
        )}
      </div>
      <div className="mb-8 font-mono text-[10px] font-medium tracking-[0.1em] text-faint">{week?.codeCaption ?? ''}</div>

      <div className="mb-10 flex items-start gap-3 border-l-2 border-red bg-[#FFF5F4] p-5">
        <div className="min-w-0 flex-1">
          <div className="mb-2 font-mono text-[10.4px] font-medium tracking-[0.16em] text-red">ONE REAL TRAP THIS LEVEL</div>
          {week === undefined ? <SkelLines count={2} lastWidth="w-2/5" /> : <Prose content={week.pitfall} className="font-sans text-[16px] leading-[1.7] text-[#2C2F35]" />}
        </div>
      </div>

      <div className="border-t border-ink/14 pt-6">
        <div className="mb-4 font-mono text-[10.4px] font-medium tracking-[0.2em] text-faint">ALL SEVEN STAGES</div>
        {questions === undefined
          ? Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="flex items-center gap-3.5 border-b border-dotted border-ink/18 py-3">
                <Skel className="h-3 w-7" />
                <Skel className="h-3.5 flex-1" />
                <Skel className="h-3 w-12" />
              </div>
            ))
          : questions.map((q) => <StageRow key={q._id} q={q} sub={subByQuestion.get(q._id)} today={today} />)}
      </div>
    </div>
  )
}

function StageRow({ q, sub, today }: { q: Doc<'questions'>; sub: Doc<'submissions'> | undefined; today: string }) {
  const done = sub !== undefined
  const isToday = q.date === today
  const reachable = done || q.date <= today
  return (
    <Link
      to={reachable ? `/question/${q._id}` : '#'}
      className="flex items-center gap-3.5 border-b border-dotted border-ink/18 py-3 no-underline"
      style={{ cursor: reachable ? 'pointer' : 'default' }}
    >
      <div className="w-9 shrink-0 font-mono text-[10.4px] font-medium tracking-[0.1em] text-faint">D{q.dayNumber}</div>
      <div className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-sans text-[15.5px]" style={{ color: done || isToday ? '#14161A' : reachable ? '#44474D' : '#9A9CA1' }}>
        {q.title}
      </div>
      <div className="hidden shrink-0 font-mono text-[9.8px] font-medium tracking-[0.12em] text-faint sm:block">{q.difficulty.toUpperCase()}</div>
      <div className="w-16 shrink-0 text-right font-mono text-[11px] font-medium" style={{ color: done ? '#0A7A52' : isToday ? '#C8362B' : '#9A9CA1' }}>
        {done ? `${sub.bestScore} PTS` : isToday ? 'OPEN →' : q.date < today ? 'MISSED' : 'LOCKED'}
      </div>
    </Link>
  )
}
