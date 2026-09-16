import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { relativeTime } from '../lib/date'
import { PrimaryButton } from '../components/ui'
import { useToast } from '../lib/toastContext'
import { Skel, SkelLines } from '../components/Skeleton'
import { EmptyState } from '../components/EmptyState'

// ── mention autocomplete hook ───────────────────────────────────────────────

function useMentionState() {
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const suggestions = useQuery(
    api.profiles.searchHandles,
    mentionQuery !== null ? { prefix: mentionQuery } : 'skip',
  )
  return { mentionQuery, setMentionQuery, suggestions: suggestions ?? [] }
}

interface MentionBoxProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
  minRows?: number
}

function MentionBox({ value, onChange, placeholder, className, minRows = 3 }: MentionBoxProps) {
  const { mentionQuery, setMentionQuery, suggestions } = useMentionState()
  const [selectedIdx, setSelectedIdx] = useState(0)
  const ref = useRef<HTMLTextAreaElement>(null)

  function detectMention(text: string, caret: number) {
    const before = text.slice(0, caret)
    const match = before.match(/@([a-zA-Z0-9_]*)$/)
    if (match) {
      setMentionQuery(match[1])
      setSelectedIdx(0)
    } else {
      setMentionQuery(null)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    onChange(e.target.value)
    detectMention(e.target.value, e.target.selectionStart ?? e.target.value.length)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (mentionQuery === null || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIdx((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIdx((i) => (i - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      insertHandle(suggestions[selectedIdx])
    } else if (e.key === 'Escape') {
      setMentionQuery(null)
    }
  }

  function insertHandle(handle: string) {
    const ta = ref.current
    if (!ta) return
    const caret = ta.selectionStart ?? value.length
    const before = value.slice(0, caret)
    const after = value.slice(caret)
    const replaced = before.replace(/@([a-zA-Z0-9_]*)$/, `@${handle} `)
    onChange(replaced + after)
    setMentionQuery(null)
    setTimeout(() => {
      ta.selectionStart = ta.selectionEnd = replaced.length
      ta.focus()
    }, 0)
  }

  return (
    <div className="relative">
      {mentionQuery !== null && suggestions.length > 0 && (
        <ul className="absolute bottom-full left-0 z-50 mb-1 w-56 border border-ink/20 bg-paper shadow-sm">
          {suggestions.map((h, i) => (
            <li key={h}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); insertHandle(h) }}
                className={`w-full cursor-pointer px-3.5 py-2 text-left font-mono text-[11.5px] tracking-[0.1em] ${
                  i === selectedIdx ? 'bg-red text-paper' : 'text-ink hover:bg-ink/6'
                }`}
              >
                @{h}
              </button>
            </li>
          ))}
        </ul>
      )}
      <textarea
        ref={ref}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={minRows}
        className={className}
      />
    </div>
  )
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function CommentsPage({ questionId }: { questionId: string }) {
  const qid = questionId as Id<'questions'>
  const flash = useToast()
  const question = useQuery(api.syllabus.getQuestion, { questionId: qid })
  const comments = useQuery(api.comments.getComments, { questionId: qid })
  const profile = useQuery(api.profiles.getMyProfile)
  const postComment = useMutation(api.comments.postComment)
  const deleteComment = useMutation(api.comments.deleteComment)

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

  const del = async (commentId: Id<'comments'>) => {
    await deleteComment({ commentId })
  }

  const canDelete = (userId: string) => userId === profile?.userId || profile?.isAdmin

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

      {/* Compose box */}
      <div className="mb-7.5 border-b border-ink/14 pb-7.5">
        <MentionBox
          value={draft}
          onChange={setDraft}
          placeholder="Write a note on your approach, or where you got stuck…"
          minRows={4}
          className="w-full resize-y border border-ink/20 bg-paper p-3.5 font-sans text-[17.3px] leading-[1.65] outline-none focus:border-red"
        />
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="font-mono text-[9.8px] font-medium tracking-[0.14em] text-faint">
            POSTING AS {profile?.handle.toUpperCase() ?? '…'}
          </div>
          <PrimaryButton onClick={() => void post()}>POST NOTE</PrimaryButton>
        </div>
      </div>

      {/* Loading skeletons */}
      {comments === undefined &&
        Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="mb-4 border border-ink/14">
            <div className="flex items-center border-b border-ink/10 px-4 py-2.5">
              <Skel className="h-3 w-24" />
            </div>
            <div className="px-4 py-3.5">
              <SkelLines count={2} lastWidth="w-1/2" />
            </div>
          </div>
        ))}

      {/* Comment cards */}
      {comments?.map((c) => (
        <div key={c._id} className="mb-4 border border-ink/14 bg-paper">
          {/* Card header: handle + time + delete */}
          <div className="flex items-center justify-between border-b border-ink/10 px-4 py-2.5">
            <div className="flex items-center gap-3">
              <Link to={`/runner/${c.handle}`} className="font-mono text-[13px] font-medium text-ink no-underline hover:text-red">
                {c.handle}
              </Link>
              <span className="font-mono text-[9.5px] font-medium tracking-[0.12em] text-faint">
                {relativeTime(c.createdAt)} AGO
              </span>
            </div>
            {canDelete(c.userId) && (
              <button
                onClick={() => void del(c._id)}
                className="cursor-pointer border border-red/40 px-2.5 py-1 font-mono text-[9.5px] font-medium tracking-[0.14em] text-red transition-colors hover:bg-red hover:text-paper"
              >
                DELETE
              </button>
            )}
          </div>

          {/* Comment body */}
          <div className="px-4 py-4">
            <CommentBody body={c.body} />
          </div>

          {/* Reply action */}
          <div className="px-4 pb-3.5">
            <button
              onClick={() => setReplyOpen(replyOpen === c._id ? null : c._id)}
              className="cursor-pointer font-mono text-[9.8px] font-medium tracking-[0.14em] text-mute hover:text-red"
            >
              ↳ REPLY
            </button>
          </div>

          {/* Reply compose */}
          {replyOpen === c._id && (
            <div className="border-t border-ink/10 px-4 pb-4 pt-3">
              <MentionBox
                value={replyDraft}
                onChange={setReplyDraft}
                placeholder={`Reply to ${c.handle}…`}
                minRows={2}
                className="w-full resize-y border border-ink/20 bg-paper p-3 font-sans text-[14.5px] outline-none focus:border-red"
              />
              <div className="mt-2.5 flex items-center gap-3.5">
                <PrimaryButton onClick={() => void reply(c._id)}>SEND REPLY</PrimaryButton>
                <button onClick={() => setReplyOpen(null)} className="cursor-pointer font-mono text-[10px] font-medium tracking-[0.14em] text-mute">
                  CANCEL
                </button>
              </div>
            </div>
          )}

          {/* Replies */}
          {c.replies.map((rp) => (
            <div key={rp._id} className="border-t border-ink/8 bg-ink/[0.018] pl-8 pr-4 py-3.5">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Link to={`/runner/${rp.handle}`} className="font-mono text-[12px] font-medium text-ink no-underline hover:text-red">
                    {rp.handle}
                  </Link>
                  <span className="font-mono text-[9.3px] font-medium tracking-[0.12em] text-faint">{relativeTime(rp.createdAt)} AGO</span>
                </div>
                {canDelete(rp.userId) && (
                  <button
                    onClick={() => void del(rp._id)}
                    className="cursor-pointer border border-red/40 px-2.5 py-1 font-mono text-[9.5px] font-medium tracking-[0.14em] text-red transition-colors hover:bg-red hover:text-paper"
                  >
                    DELETE
                  </button>
                )}
              </div>
              <CommentBody body={rp.body} className="font-sans text-[15px] leading-[1.68]" />
            </div>
          ))}
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

function CommentBody({ body, className }: { body: string; className?: string }) {
  const parts = body.split(/(@[a-zA-Z0-9_]+)/g)
  return (
    <div className={`whitespace-pre-wrap ${className ?? 'font-sans text-[17.3px] leading-[1.75] md:text-[19.5px]'}`}>
      {parts.map((part, i) =>
        /^@[a-zA-Z0-9_]+$/.test(part) ? (
          <span key={i} className="font-mono text-red">{part}</span>
        ) : (
          part
        ),
      )}
    </div>
  )
}
