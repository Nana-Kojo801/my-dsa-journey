import { useEffect, useRef, useState } from 'react'
import { useAction, useMutation, useQuery } from 'convex/react'
import { ConvexError } from 'convex/values'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import type { FunctionReturnType } from 'convex/server'
import { compressImageFile } from '../lib/image'
import { todayLocalStr, timeUntilNextMidnight } from '../lib/date'
import { useToast } from '../lib/toastContext'
import { ScoreBreakdownModal } from '../components/ScoreBreakdown'
import { StageHeader } from './stage/StageHeader'
import { ScreenshotIntake } from './stage/ScreenshotIntake'
import { ScreenshotHelpModal } from './stage/ScreenshotHelpModal'
import { DayLeaderboard } from './stage/DayLeaderboard'
import { StageHuddle } from './stage/StageHuddle'
import { ReadCorrectionModal } from './stage/ReadCorrectionModal'
import type { Extracted, Best, FeedbackField } from './stage/types'

type DayRow = FunctionReturnType<typeof api.submissions.getDayLeaderboardRows>[number]

export default function StagePage({ questionId }: { questionId: string | undefined }) {
  const qid = questionId as Id<'questions'> | undefined
  const flash = useToast()

  const question = useQuery(api.syllabus.getQuestion, qid ? { questionId: qid } : 'skip')
  const week = useQuery(api.syllabus.getWeek, question ? { weekNumber: question.weekNumber } : 'skip')
  const mySubmission = useQuery(api.submissions.getMySubmission, qid ? { questionId: qid } : 'skip')
  const cohortCount = useQuery(api.submissions.getQuestionSubmissionCount, qid ? { questionId: qid } : 'skip')
  const dayRows = useQuery(api.submissions.getDayLeaderboardRows, qid ? { questionId: qid } : 'skip')
  const comments = useQuery(api.comments.getComments, qid ? { questionId: qid } : 'skip')
  const profile = useQuery(api.profiles.getMyProfile)

  const extract = useAction(api.vision.extractSubmission)
  const postComment = useMutation(api.comments.postComment)
  const deleteComment = useMutation(api.comments.deleteComment)
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
  const [fbField, setFbField] = useState<FeedbackField>('RUNTIME %')
  const [fbText, setFbText] = useState('')
  const [helpOpen, setHelpOpen] = useState(false)
  const [detailRow, setDetailRow] = useState<DayRow | null>(null)

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
      <StageHeader question={question} week={week} isToday={isToday} countdown={countdown} cohortCount={cohortCount} />

      <div className="flex flex-wrap items-start gap-6 md:gap-10">
        <ScreenshotIntake
          phase={phase}
          current={current}
          best={best}
          justSubmitted={justResult !== null}
          celebrateKey={celebrateKey}
          failReason={failReason}
          isLocked={!isToday}
          onFile={(file) => void onFile(file)}
          onOpenHelp={() => setHelpOpen(true)}
          onOpenFeedback={() => setFbOpen(true)}
        />

        <DayLeaderboard cohortCount={cohortCount} rows={dayRows} questionTitle={question?.title} onSelectRow={setDetailRow} />
      </div>

      <StageHuddle
        qid={qid}
        questionTitle={question?.title}
        comments={comments}
        posterHandle={profile?.handle}
        profileUserId={profile?.userId}
        profileIsAdmin={profile?.isAdmin}
        draft={draft}
        onDraftChange={setDraft}
        onPost={() => void doPostComment()}
        replyOpenId={replyOpen}
        onToggleReply={(commentId) => setReplyOpen(replyOpen === commentId ? null : commentId)}
        replyDraft={replyDraft}
        onReplyDraftChange={setReplyDraft}
        onReply={(parentId) => void doReply(parentId)}
        onDeleteComment={(commentId) => void deleteComment({ commentId })}
      />

      {fbOpen && (
        <ReadCorrectionModal
          question={question}
          sent={fbSent}
          field={fbField}
          onFieldChange={setFbField}
          note={fbText}
          onNoteChange={setFbText}
          onSubmit={() => void sendFeedback()}
          onDone={() => {
            setFbOpen(false)
            setFbSent(false)
            setFbText('')
          }}
          onClose={() => setFbOpen(false)}
        />
      )}

      {helpOpen && <ScreenshotHelpModal onClose={() => setHelpOpen(false)} />}

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
