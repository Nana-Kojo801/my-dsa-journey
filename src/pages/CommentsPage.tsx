import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { relativeTime } from '../lib/date'
import { PrimaryButton } from '../components/ui'
import { useToast } from '../lib/toastContext'
import { Skel, SkelLines } from '../components/Skeleton'
import { EmptyState } from '../components/EmptyState'

export default function CommentsPage({ questionId }: { questionId: string }) {
  const qid = questionId as Id<'questions'>
  const flash = useToast()
  const question = useQuery(api.syllabus.getQuestion, { questionId: qid })
  const comments = useQuery(api.comments.getComments, { questionId: qid })
  const profile = useQuery(api.profiles.getMyProfile)
  const postComment = useMutation(api.comments.postComment)

  const [draft, setDraft] = useState('')
  const [replyOpen, setReplyOpen] = useState<string | null>(null)
  const [replyDraft, setReplyDraft] = useState('')

  const post = async () => {
    const body = draft.trim()
    if (!body) return flash('WRITE SOMETHING FIRST')
    await postComment({ questionId: qid, body })
    setDraft('')
  }

  const reply = async (parentId: Id<'comments'>) => {
    const body = replyDraft.trim()
    if (!body) return
    await postComment({ questionId: qid, body, parentId })
    setReplyDraft('')
    setReplyOpen(null)
  }

  return (
    <div className="animate-fade mx-auto max-w-[820px]">
      <Link to={`/question/${qid}`} className="mb-6 inline-block cursor-pointer font-mono text-[10.4px] font-medium tracking-[0.18em] text-mute no-underline">
        ← BACK TO THE STAGE
      </Link>
      <div className="mb-4 font-mono text-[10.4px] font-medium tracking-[0.2em] text-faint">
        {question && `STAGE ${question.dayNumber} · `}
        {comments === undefined ? '…' : `${comments.length} NOTES`}
      </div>
      {!question ? (
        <Skel className="mb-6.5 h-[32px] w-[70%] md:h-[52px]" />
      ) : (
        <div className="mb-3.5 font-serif text-[32px] leading-[1] tracking-[-0.015em] md:text-[52px]">
          Margin notes on
          <br />
          {question.title.toLowerCase()}
        </div>
      )}
      <div className="mb-6.5 border-b border-ink/14 pb-6.5" />

      <div className="mb-7.5 border-b border-ink/14 pb-7.5">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a note on your approach, or where you got stuck…"
          className="w-full min-h-[86px] resize-y border border-ink/20 bg-paper p-3.5 font-sans text-[17.3px] leading-[1.65] outline-none focus:border-red"
        />
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="font-mono text-[9.8px] font-medium tracking-[0.14em] text-faint">
            POSTING AS {profile?.handle.toUpperCase() ?? '…'}
          </div>
          <PrimaryButton onClick={() => void post()}>POST NOTE</PrimaryButton>
        </div>
      </div>

      {comments === undefined &&
        Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="mb-7 flex flex-wrap gap-5 border-b border-dotted border-ink/20 pb-7">
            <div className="min-w-0 flex-0 basis-[128px]">
              <Skel className="h-3 w-20" />
            </div>
            <div className="min-w-0 flex-1 basis-[240px] border-l border-ink/14 pl-5">
              <SkelLines count={2} lastWidth="w-1/2" />
            </div>
          </div>
        ))}

      {comments?.map((c) => (
        <div key={c._id} className="mb-7 flex flex-wrap gap-5 border-b border-dotted border-ink/20 pb-7">
          <div className="min-w-0 flex-0 basis-[128px]">
            <div className="mb-2 font-mono text-[12.6px] text-ink">{c.handle}</div>
            <div className="font-mono text-[9.8px] font-medium leading-[1.5] tracking-[0.12em] text-faint">
              {relativeTime(c.createdAt)} AGO
            </div>
          </div>
          <div className="min-w-0 flex-1 basis-[240px] border-l border-ink/14 pl-5">
            <div className="whitespace-pre-wrap font-sans text-[17.3px] leading-[1.75] md:text-[19.5px]">{c.body}</div>
            <button
              onClick={() => setReplyOpen(replyOpen === c._id ? null : c._id)}
              className="mt-2.5 cursor-pointer font-mono text-[9.8px] font-medium tracking-[0.14em] text-mute hover:text-red"
            >
              ↳ REPLY
            </button>
            {replyOpen === c._id && (
              <div className="mt-3 border-l border-ink/18 pl-4.5">
                <textarea
                  value={replyDraft}
                  onChange={(e) => setReplyDraft(e.target.value)}
                  placeholder={`Reply to ${c.handle}…`}
                  className="w-full min-h-[56px] resize-y border border-ink/20 bg-paper p-3 font-sans text-[14.5px] outline-none focus:border-red"
                />
                <div className="mt-2.5 flex items-center gap-3.5">
                  <PrimaryButton onClick={() => void reply(c._id)}>SEND REPLY</PrimaryButton>
                  <button onClick={() => setReplyOpen(null)} className="cursor-pointer font-mono text-[10px] font-medium tracking-[0.14em] text-mute">
                    CANCEL
                  </button>
                </div>
              </div>
            )}
            {c.replies.map((rp) => (
              <div key={rp._id} className="mt-4.5 border-l border-ink/18 pl-4.5">
                <div className="mb-1.5 flex items-baseline gap-2.5">
                  <div className="font-mono text-[11.5px] text-ink">{rp.handle}</div>
                  <div className="font-mono text-[9.3px] font-medium tracking-[0.12em] text-faint">{relativeTime(rp.createdAt)} AGO</div>
                </div>
                <div className="whitespace-pre-wrap font-sans text-[15px] leading-[1.68]">{rp.body}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {comments?.length === 0 && (
        <EmptyState
          bordered={false}
          title={
            <>
              Quiet in here <em className="italic text-red">so far.</em>
            </>
          }
          body={`Nobody's written a note on ${question?.title ?? 'this stage'} yet. Approach, a stuck point, a clean trick — start the huddle.`}
        />
      )}
    </div>
  )
}
