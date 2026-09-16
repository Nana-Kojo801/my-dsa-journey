import { Link } from 'react-router-dom'
import type { FunctionReturnType } from 'convex/server'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { relativeTime } from '../../lib/date'
import { PrimaryButton } from '../../components/ui'
import { Skel, SkelLines } from '../../components/Skeleton'

type Comment = FunctionReturnType<typeof api.comments.getComments>[number]

export function StageHuddle({
  qid,
  questionTitle,
  comments,
  posterHandle,
  profileUserId,
  profileIsAdmin,
  draft,
  onDraftChange,
  onPost,
  replyOpenId,
  onToggleReply,
  replyDraft,
  onReplyDraftChange,
  onReply,
  onDeleteComment,
}: {
  qid: Id<'questions'> | undefined
  questionTitle: string | undefined
  comments: Comment[] | undefined
  posterHandle: string | undefined
  profileUserId: Id<'users'> | undefined
  profileIsAdmin: boolean | undefined
  draft: string
  onDraftChange: (value: string) => void
  onPost: () => void
  replyOpenId: string | null
  onToggleReply: (commentId: string) => void
  replyDraft: string
  onReplyDraftChange: (value: string) => void
  onReply: (parentId: Id<'comments'>) => void
  onDeleteComment: (commentId: Id<'comments'>) => void
}) {
  const canDelete = (userId: string) => userId === profileUserId || profileIsAdmin

  return (
    <div className="mt-9 border-t border-ink/14 pt-8">
      <div className="mb-5.5 flex items-baseline justify-between gap-3">
        <div className="font-serif text-[30px]">The huddle</div>
        <div className="font-mono text-[10.4px] font-medium tracking-[0.14em] text-faint">
          {comments?.length ?? 0} NOTES · SPOILERS OK
        </div>
      </div>
      <textarea
        value={draft}
        onChange={(e) => onDraftChange(e.target.value)}
        placeholder="Write a note on your approach, or where you got stuck…"
        className="w-full max-w-[720px] min-h-[84px] resize-y border border-ink/20 bg-paper p-3.5 font-sans text-[15.5px] leading-[1.65] outline-none focus:border-red"
      />
      <div className="my-3 flex max-w-[720px] flex-wrap items-center justify-between gap-3">
        <div className="font-mono text-[9.8px] font-medium tracking-[0.14em] text-faint">
          POSTING AS {posterHandle?.toUpperCase() ?? '…'}
        </div>
        <PrimaryButton onClick={onPost}>POST NOTE</PrimaryButton>
      </div>

      {comments === undefined &&
        Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="mb-4 border border-ink/14">
            <div className="flex items-center border-b border-ink/10 px-4 py-2.5">
              <Skel className="h-3 w-24" />
            </div>
            <div className="px-4 py-3.5">
              <SkelLines count={2} lastWidth="w-1/3" />
            </div>
          </div>
        ))}

      {comments?.length === 0 && (
        <div className="mb-5.5 border-l-2 border-ink/18 py-1 pl-4.5 font-sans text-[15px] italic leading-[1.6] text-mute">
          Quiet in here. Be the first to say something about {questionTitle ?? 'this stage'}.
        </div>
      )}

      {(comments ?? []).slice(0, 3).map((c) => (
        <div key={c._id} className="mb-4 border border-ink/14 bg-paper">
          {/* Card header: handle + time + delete */}
          <div className="flex items-center justify-between border-b border-ink/10 px-4 py-2.5">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[12.5px] font-medium text-ink">{c.handle}</span>
              <span className="font-mono text-[9.5px] font-medium tracking-[0.12em] text-faint">{relativeTime(c.createdAt)} AGO</span>
            </div>
            {canDelete(c.userId) && (
              <button
                onClick={() => onDeleteComment(c._id)}
                className="cursor-pointer border border-red/40 px-2.5 py-1 font-mono text-[9.5px] font-medium tracking-[0.14em] text-red transition-colors hover:bg-red hover:text-paper"
              >
                DELETE
              </button>
            )}
          </div>

          {/* Comment body */}
          <div className="max-w-[74ch] whitespace-pre-wrap px-4 py-3.5 font-sans text-[16px] leading-[1.72]">{c.body}</div>

          {/* Reply action */}
          <div className="px-4 pb-3.5">
            <button
              onClick={() => onToggleReply(c._id)}
              className="cursor-pointer font-mono text-[9.8px] font-medium tracking-[0.14em] text-mute hover:text-red"
            >
              ↳ REPLY
            </button>
          </div>

          {/* Reply compose */}
          {replyOpenId === c._id && (
            <div className="border-t border-ink/10 px-4 pb-4 pt-3">
              <textarea
                value={replyDraft}
                onChange={(e) => onReplyDraftChange(e.target.value)}
                placeholder={`Reply to ${c.handle}…`}
                className="w-full max-w-[640px] min-h-[56px] resize-y border border-ink/20 bg-paper p-3 font-sans text-[14.5px] outline-none focus:border-red"
              />
              <div className="mt-2.5 flex items-center gap-3.5">
                <PrimaryButton onClick={() => onReply(c._id)}>SEND REPLY</PrimaryButton>
                <button onClick={() => onToggleReply(c._id)} className="cursor-pointer font-mono text-[10px] font-medium tracking-[0.14em] text-mute">
                  CANCEL
                </button>
              </div>
            </div>
          )}

          {/* Replies */}
          {c.replies.map((rp) => (
            <div key={rp._id} className="border-t border-ink/8 bg-ink/[0.018] py-3.5 pl-8 pr-4">
              <div className="mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[11.5px] font-medium text-ink">{rp.handle}</span>
                  <span className="font-mono text-[9.3px] font-medium tracking-[0.12em] text-faint">{relativeTime(rp.createdAt)} AGO</span>
                </div>
                {canDelete(rp.userId) && (
                  <button
                    onClick={() => onDeleteComment(rp._id)}
                    className="cursor-pointer border border-red/40 px-2.5 py-1 font-mono text-[9.5px] font-medium tracking-[0.14em] text-red transition-colors hover:bg-red hover:text-paper"
                  >
                    DELETE
                  </button>
                )}
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
  )
}
