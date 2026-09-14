import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAction, useMutation, useQuery } from 'convex/react'
import { ConvexError } from 'convex/values'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { compressImageFile } from '../lib/image'
import { todayLocalStr, timeUntilNextMidnight, relativeTime } from '../lib/date'
import { PrimaryButton, OutlineButton, TextButton, MonoLabel } from '../components/ui'
import { useToast } from '../lib/toastContext'
import { Skel, SkelLines, SkelRow } from '../components/Skeleton'
import { SlotRows } from '../components/EmptyState'
import { ScoreBreakdownModal } from '../components/ScoreBreakdown'
import { ScoreCell } from '../components/ScoreCell'

type Extracted = { runtimePercentile: number; memoryPercentile: number; runtimeValue: string; memoryValue: string }
type Best = { runtimePercentile: number; memoryPercentile: number } | null

const FB_FIELDS = ['RUNTIME %', 'MEMORY %', 'RUNTIME VALUE', 'MEMORY VALUE', 'ALL OF IT'] as const

export default function StagePage({ questionId }: { questionId: string | undefined }) {
  const qid = questionId as Id<'questions'> | undefined
  const flash = useToast()
  const fileRef = useRef<HTMLInputElement>(null)

  const question = useQuery(api.syllabus.getQuestion, qid ? { questionId: qid } : 'skip')
  const week = useQuery(api.syllabus.getWeek, question ? { weekNumber: question.weekNumber } : 'skip')
  const mySubmission = useQuery(api.submissions.getMySubmission, qid ? { questionId: qid } : 'skip')
  const cohortCount = useQuery(api.submissions.getQuestionSubmissionCount, qid ? { questionId: qid } : 'skip')
  const dayRows = useQuery(api.submissions.getDayLeaderboardRows, qid ? { questionId: qid } : 'skip')
  const comments = useQuery(api.comments.getComments, qid ? { questionId: qid } : 'skip')
  const profile = useQuery(api.profiles.getMyProfile)

  const extract = useAction(api.vision.extractSubmission)
  const postComment = useMutation(api.comments.postComment)
  const submitFeedback = useMutation(api.feedback.submitFeedback)

  const [phase, setPhase] = useState<'idle' | 'processing' | 'failed'>('idle')
  const [failReason, setFailReason] = useState('')
  const [justResult, setJustResult] = useState<{ current: Extracted; best: Best } | null>(null)
  const [celebrateKey, setCelebrateKey] = useState(0)

  const [draft, setDraft] = useState('')
  const [replyOpen, setReplyOpen] = useState<string | null>(null)
  const [replyDraft, setReplyDraft] = useState('')

  const [fbOpen, setFbOpen] = useState(false)
  const [fbSent, setFbSent] = useState(false)
  const [fbField, setFbField] = useState<(typeof FB_FIELDS)[number]>('RUNTIME %')
  const [fbText, setFbText] = useState('')
  const [helpOpen, setHelpOpen] = useState(false)
  const [detailRow, setDetailRow] = useState<NonNullable<typeof dayRows>[number] | null>(null)

  const [, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const onFile = async (file: File) => {
    if (!qid) return
    setPhase('processing')
    try {
      const { base64, mimeType } = await compressImageFile(file)
      const result = await extract({ questionId: qid, imageBase64: base64, mimeType })
      setJustResult(result as { current: Extracted; best: Best })
      setPhase('idle')
      setCelebrateKey((k) => k + 1)
    } catch (e) {
      const reason =
        e instanceof ConvexError && typeof e.data === 'string'
          ? e.data
          : "The reader hit a snag on its end. Try again, or file a bug if it keeps happening."
      setFailReason(reason)
      setPhase('failed')
    }
  }

  const onFileRef = useRef(onFile)
  useEffect(() => {
    onFileRef.current = onFile
  })

  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      const active = document.activeElement
      const isEditable =
        active instanceof HTMLElement && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT' || active.isContentEditable)
      if (isEditable) return
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            e.preventDefault()
            void onFileRef.current(file)
          }
          break
        }
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [])

  if (question === null) {
    return <div className="font-sans text-mute">That stage doesn't exist.</div>
  }

  const isToday = question !== undefined && question.date === todayLocalStr()
  const countdown = timeUntilNextMidnight()
  const pad = (n: number) => String(n).padStart(2, '0')

  const current: Extracted | null =
    justResult?.current ??
    (mySubmission
      ? {
          runtimePercentile: mySubmission.runtimePercentile,
          memoryPercentile: mySubmission.memoryPercentile,
          runtimeValue: mySubmission.runtimeValue,
          memoryValue: mySubmission.memoryValue,
        }
      : null)
  const best: Best =
    justResult !== null
      ? justResult.best
      : mySubmission && mySubmission.submissionCount > 1
        ? { runtimePercentile: mySubmission.bestRuntimePercentile, memoryPercentile: mySubmission.bestMemoryPercentile }
        : null

  const doPostComment = async () => {
    if (!qid) return
    const body = draft.trim()
    if (!body) return flash('WRITE SOMETHING FIRST')
    await postComment({ questionId: qid, body })
    setDraft('')
    flash('NOTE POSTED')
  }

  const doReply = async (parentId: Id<'comments'>) => {
    if (!qid) return
    const body = replyDraft.trim()
    if (!body) return
    await postComment({ questionId: qid, body, parentId })
    setReplyDraft('')
    setReplyOpen(null)
  }

  const sendFeedback = async () => {
    if (!qid) return
    const note = fbText.trim()
    if (!note) return flash('DESCRIBE WHAT WENT WRONG')
    await submitFeedback({ questionId: qid, field: fbField, userNote: note })
    setFbSent(true)
  }

  return (
    <div className="animate-fade mx-auto max-w-[1120px]">
      <div className="mb-7 flex flex-wrap gap-6 border-b border-ink/14 pb-7 md:gap-11">
        <div className="min-w-0 flex-1 basis-[320px]">
          {question === undefined ? (
            <div>
              <Skel className="mb-4.5 h-3 w-48" />
              <Skel className="mb-5 h-[34px] w-[80%] md:h-[56px]" />
              <Skel className="h-3 w-32" />
            </div>
          ) : (
            <>
              <div className="mb-4.5 flex flex-wrap items-center gap-2.5">
                <Link
                  to={`/level/${question.weekNumber}`}
                  className="cursor-pointer border-b border-red/35 pb-0.5 font-mono text-[10.4px] font-medium tracking-[0.16em] text-red no-underline"
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
                <a href={question.url} target="_blank" rel="noreferrer" className="font-mono text-[10.4px] font-medium tracking-[0.14em]">
                  OPEN ON LEETCODE ↗
                </a>
                <Link
                  to={`/level/${question.weekNumber}`}
                  className="cursor-pointer font-mono text-[10.4px] font-medium tracking-[0.14em] text-red no-underline"
                >
                  READ THE BRIEFING →
                </Link>
              </div>
            </>
          )}
        </div>
        {isToday && (
          <div className="flex flex-1 basis-[210px] flex-col justify-end gap-2.5">
            <MonoLabel>STAGE CLOSES IN</MonoLabel>
            <div className="font-mono text-[30px] leading-none tracking-[-0.02em] md:text-[44px]">
              {pad(countdown.hours)}
              <span
                className="ml-0.5 mr-2 font-sans text-[0.3em] font-medium tracking-[0.06em] text-faint"
                style={{ verticalAlign: '0.3em' }}
              >
                H
              </span>
              {pad(countdown.minutes)}
              <span
                className="ml-0.5 mr-2 font-sans text-[0.3em] font-medium tracking-[0.06em] text-faint"
                style={{ verticalAlign: '0.3em' }}
              >
                M
              </span>
              <span className="text-faint">
                {pad(countdown.seconds)}
                <span
                  className="ml-0.5 font-sans text-[0.3em] font-medium tracking-[0.06em]"
                  style={{ verticalAlign: '0.3em' }}
                >
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

      <div className="flex flex-wrap items-start gap-6 md:gap-10">
        <div className="min-w-0 flex-1 basis-[300px]">
          <div className="mb-4 flex items-center gap-2.5">
            <MonoLabel>PROOF · SCREENSHOT INTAKE</MonoLabel>
            <button
              onClick={() => setHelpOpen(true)}
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
              if (f) void onFile(f)
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
              <div className="mt-4 font-mono text-[9.8px] font-medium tracking-[0.1em] text-faint">
                OR PASTE WITH CTRL+V / ⌘V
              </div>
            </div>
          )}

          {phase === 'processing' && (
            <div className="relative overflow-hidden border border-ink/20 bg-paper px-6 py-13 text-center">
              <div className="animate-pulse absolute inset-x-0 top-0 h-px bg-red" />
              <div className="mb-3 font-serif text-[27.6px] leading-[1.2]">Reading the panel…</div>
              <div className="animate-tick font-mono text-[10.9px] font-medium tracking-[0.18em] text-red">
                VISION MODEL · 4 FIELDS
              </div>
            </div>
          )}

          {phase === 'idle' && current !== null && (
            <div className="relative">
              {justResult !== null && (
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
                <div className="mt-4 flex items-center gap-2.5 bg-[#FFF8E8] px-3.5 py-3 border-l-2 border-amber">
                  <div className="flex-1 font-sans text-[14.4px] leading-[1.5] text-[#4A3B12]">
                    High-water mark held for the board — your best runtime on this stage stands at{' '}
                    <strong>{best.runtimePercentile.toFixed(1)}%</strong> while the values above show the latest run.
                  </div>
                </div>
              )}
              <div className="mt-5.5 flex flex-wrap gap-4">
                <OutlineButton onClick={() => fileRef.current?.click()}>RESUBMIT</OutlineButton>
                <TextButton onClick={() => setFbOpen(true)} className="border-b border-red/35 py-3">
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
                <TextButton onClick={() => setFbOpen(true)} className="border-b border-red/35 py-3">
                  FILE A READER BUG
                </TextButton>
              </div>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 basis-[280px]">
          <div className="mb-5 flex items-baseline justify-between gap-3">
            <div className="font-serif text-[26px]">Today's leaderboard</div>
            <div className="font-mono text-[10.4px] font-medium tracking-[0.14em] text-faint">
              {cohortCount ?? 0} CLEARED
            </div>
          </div>
          {dayRows === undefined ? (
            <div className="border-t border-ink/30">
              {Array.from({ length: 3 }, (_, i) => (
                <SkelRow key={i} className="border-b border-ink/10" />
              ))}
            </div>
          ) : dayRows.length > 0 ? (
            <div className="border-t border-ink/30">
              {dayRows.slice(0, 6).map((r, i) => (
                <div
                  key={r.submission._id}
                  onClick={() => setDetailRow(r)}
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
                  Nobody's cleared <em className="italic text-red">{question?.title ?? 'this stage'}</em> yet.
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
      </div>

      <div className="mt-9 border-t border-ink/14 pt-8">
        <div className="mb-5.5 flex items-baseline justify-between gap-3">
          <div className="font-serif text-[30px]">The huddle</div>
          <div className="font-mono text-[10.4px] font-medium tracking-[0.14em] text-faint">
            {comments?.length ?? 0} NOTES · SPOILERS OK
          </div>
        </div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a note on your approach, or where you got stuck…"
          className="w-full max-w-[720px] min-h-[84px] resize-y border border-ink/20 bg-paper p-3.5 font-sans text-[15.5px] leading-[1.65] outline-none focus:border-red"
        />
        <div className="my-3 flex max-w-[720px] flex-wrap items-center justify-between gap-3">
          <div className="font-mono text-[9.8px] font-medium tracking-[0.14em] text-faint">
            POSTING AS {profile?.handle.toUpperCase() ?? '…'}
          </div>
          <PrimaryButton onClick={() => void doPostComment()}>POST NOTE</PrimaryButton>
        </div>

        {comments === undefined &&
          Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="mb-5.5 border-b border-dotted border-ink/20 pb-5.5">
              <Skel className="mb-2.5 h-3 w-24" />
              <SkelLines count={2} lastWidth="w-1/3" />
            </div>
          ))}
        {comments?.length === 0 && (
          <div className="mb-5.5 border-l-2 border-ink/18 py-1 pl-4.5 font-sans text-[15px] italic leading-[1.6] text-mute">
            Quiet in here. Be the first to say something about {question?.title ?? 'this stage'}.
          </div>
        )}
        {(comments ?? []).slice(0, 3).map((c) => (
          <div key={c._id} className="mb-5.5 border-b border-dotted border-ink/20 pb-5.5">
            <div className="mb-2 flex items-baseline gap-2.5">
              <div className="font-mono text-[12.5px] text-ink">{c.handle}</div>
              <div className="font-mono text-[9.8px] font-medium tracking-[0.12em] text-faint">{relativeTime(c.createdAt)} AGO</div>
            </div>
            <div className="max-w-[74ch] whitespace-pre-wrap font-sans text-[16px] leading-[1.72]">{c.body}</div>
            <button
              onClick={() => setReplyOpen(replyOpen === c._id ? null : c._id)}
              className="mt-2 cursor-pointer font-mono text-[9.8px] font-medium tracking-[0.14em] text-mute hover:text-red"
            >
              ↳ REPLY
            </button>
            {replyOpen === c._id && (
              <div className="mt-3 border-l border-ink/18 pl-4.5">
                <textarea
                  value={replyDraft}
                  onChange={(e) => setReplyDraft(e.target.value)}
                  placeholder={`Reply to ${c.handle}…`}
                  className="w-full max-w-[640px] min-h-[56px] resize-y border border-ink/20 bg-paper p-3 font-sans text-[14.5px] outline-none focus:border-red"
                />
                <div className="mt-2.5 flex items-center gap-3.5">
                  <PrimaryButton onClick={() => void doReply(c._id)}>SEND REPLY</PrimaryButton>
                  <button onClick={() => setReplyOpen(null)} className="cursor-pointer font-mono text-[10px] font-medium tracking-[0.14em] text-mute">
                    CANCEL
                  </button>
                </div>
              </div>
            )}
            {c.replies.map((rp) => (
              <div key={rp._id} className="mt-4 border-l border-ink/18 pl-4.5">
                <div className="mb-1.5 flex items-baseline gap-2.5">
                  <div className="font-mono text-[11.5px] text-ink">{rp.handle}</div>
                  <div className="font-mono text-[9.3px] font-medium tracking-[0.12em] text-faint">{relativeTime(rp.createdAt)} AGO</div>
                </div>
                <div className="max-w-[70ch] whitespace-pre-wrap font-sans text-[15px] leading-[1.68]">{rp.body}</div>
              </div>
            ))}
          </div>
        ))}
        {comments !== undefined && comments.length > 0 && (
          <Link to={`/comments/${qid}`} className="cursor-pointer font-mono text-[10.4px] font-medium tracking-[0.16em] text-red no-underline">
            ALL {comments.length} NOTES →
          </Link>
        )}
      </div>

      {fbOpen && (
        <div onClick={() => setFbOpen(false)} className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/42 p-4.5">
          <div onClick={(e) => e.stopPropagation()} className="animate-fade w-full max-w-[480px] border border-ink/30 bg-ground p-6 shadow-[0_18px_50px_rgba(20,22,26,.22)]">
            {fbSent ? (
              <div>
                <MonoLabel className="mb-4 text-green">FILED · QUEUED FOR THE READER</MonoLabel>
                <div className="mb-3.5 font-serif text-[30px] leading-[1.1]">Correction logged.</div>
                <div className="mb-6.5 font-sans text-[16.7px] leading-[1.7] text-mute">
                  Your submission stands as-is for now. When the reader is fixed we re-run the extraction and your
                  board number updates automatically.
                </div>
                <PrimaryButton
                  onClick={() => {
                    setFbOpen(false)
                    setFbSent(false)
                    setFbText('')
                  }}
                  className="w-full text-center"
                >
                  DONE
                </PrimaryButton>
              </div>
            ) : (
              <div>
                <MonoLabel className="mb-4">
                  LV {question ? String(question.weekNumber).padStart(2, '0') : '—'} · STAGE {question?.dayNumber ?? '—'} · {question?.title.toUpperCase() ?? ''}
                </MonoLabel>
                <div className="mb-6 font-serif text-[30px] leading-[1.1]">
                  What did the
                  <br />
                  reader misread?
                </div>
                <div className="mb-3 font-mono text-[9.8px] font-medium tracking-[0.18em] text-mute">FIELD</div>
                <div className="mb-6 flex flex-wrap gap-2">
                  {FB_FIELDS.map((f) => (
                    <button
                      key={f}
                      onClick={() => setFbField(f)}
                      className="cursor-pointer border px-3 py-2 font-mono text-[10.4px] font-medium tracking-[0.1em]"
                      style={{
                        borderColor: fbField === f ? '#14161A' : 'rgba(20,22,26,.24)',
                        background: fbField === f ? '#14161A' : 'transparent',
                        color: fbField === f ? '#FBFBF8' : '#6E7178',
                      }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <div className="mb-3 font-mono text-[9.8px] font-medium tracking-[0.18em] text-mute">WHAT IT SHOULD HAVE BEEN</div>
                <textarea
                  value={fbText}
                  onChange={(e) => setFbText(e.target.value)}
                  placeholder="It read memory as 12% but the panel said 71.4%."
                  className="mb-6.5 w-full min-h-[88px] resize-y border border-ink/24 bg-paper p-3.5 font-sans text-[16.7px] leading-[1.6] outline-none focus:border-red"
                />
                <div className="flex flex-wrap items-center justify-end gap-4">
                  <button onClick={() => setFbOpen(false)} className="cursor-pointer font-mono text-[10.9px] font-medium tracking-[0.16em] text-mute">
                    CANCEL
                  </button>
                  <button
                    onClick={() => void sendFeedback()}
                    className="cursor-pointer bg-red px-4.5 py-3.5 font-mono text-[10.9px] font-medium tracking-[0.16em] text-ground"
                  >
                    FILE CORRECTION
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {helpOpen && (
        <div onClick={() => setHelpOpen(false)} className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/42 p-4.5">
          <div onClick={(e) => e.stopPropagation()} className="animate-fade w-full max-w-[480px] border border-ink/30 bg-ground p-6 shadow-[0_18px_50px_rgba(20,22,26,.22)]">
            <MonoLabel className="mb-4">HOW TO TAKE THE SCREENSHOT</MonoLabel>
            <div className="mb-5 font-serif text-[26px] leading-[1.15]">Getting a clean read.</div>
            <ol className="mb-6 flex flex-col gap-3.5 font-sans text-[15.5px] leading-[1.6] text-[#2C2F35]">
              <li className="flex gap-3">
                <span className="font-mono text-[13px] text-faint">01</span>
                <span>Submit your solution on LeetCode and wait for the "Accepted" result panel.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-[13px] text-faint">02</span>
                <span>
                  Screenshot the panel so both the <strong>Runtime</strong> block and the <strong>Memory</strong> block
                  are visible, each showing its "Beats X%" line.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-[13px] text-faint">03</span>
                <span>Crop out anything else — the reader only needs those two blocks, not the code or console.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-[13px] text-faint">04</span>
                <span>
                  Upload the PNG or JPG here, or just copy it and press <strong>Ctrl+V</strong> (<strong>⌘V</strong> on
                  Mac) anywhere on this page.
                </span>
              </li>
            </ol>
            <PrimaryButton onClick={() => setHelpOpen(false)} className="w-full text-center">
              GOT IT
            </PrimaryButton>
          </div>
        </div>
      )}

      {detailRow && (
        <ScoreBreakdownModal
          handle={detailRow.profile?.handle ?? 'Unknown'}
          mode="daily"
          rows={[
            {
              submission: detailRow.submission,
              question: question ? { title: question.title, weekNumber: question.weekNumber, dayNumber: question.dayNumber } : null,
            },
          ]}
          onClose={() => setDetailRow(null)}
        />
      )}
    </div>
  )
}
