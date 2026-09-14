import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { relativeTime } from '../../lib/date'
import { Skel, SkelLines } from '../../components/Skeleton'
import { EmptyState } from '../../components/EmptyState'

export function SiteFeedbackTab() {
  const items = useQuery(api.feedback.listGeneralFeedback)
  const resolve = useMutation(api.feedback.resolveGeneralFeedback)

  if (items === null) {
    return <div className="font-sans text-mute">This page is for the creator only.</div>
  }

  if (items === undefined) {
    return (
      <div>
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="mb-6 flex flex-wrap gap-5 border-b border-dotted border-ink/20 pb-6">
            <div className="min-w-0 flex-0 basis-[120px]">
              <Skel className="h-3 w-16" />
            </div>
            <div className="min-w-0 flex-1 basis-[240px]">
              <SkelLines count={2} lastWidth="w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const open = items.filter((f) => f.status === 'open')
  const resolved = items.filter((f) => f.status === 'resolved')

  return (
    <div>
      <div className="mb-6.5 font-mono text-[10.4px] font-medium tracking-[0.2em] text-faint">
        {open.length} OPEN · {resolved.length} RESOLVED
      </div>

      {open.map((f) => (
        <div key={f._id} className="mb-6 flex flex-wrap gap-5 border-b border-dotted border-ink/20 pb-6">
          <div className="min-w-0 flex-0 basis-[120px]">
            <div className="mb-2 font-mono text-[12.6px]">{f.authorHandle}</div>
            <div className="font-mono text-[9.8px] font-medium tracking-[0.12em] text-faint">{relativeTime(f.createdAt)} AGO</div>
          </div>
          <div className="min-w-0 flex-1 basis-[240px]">
            <div className="whitespace-pre-wrap font-sans text-[16.7px] leading-[1.7]">{f.message}</div>
            <button
              onClick={() => void resolve({ feedbackId: f._id as Id<'siteFeedback'> })}
              className="mt-3 cursor-pointer border border-ink/28 px-3.5 py-2 font-mono text-[10px] font-medium tracking-[0.14em] text-mute hover:border-ink hover:text-ink"
            >
              MARK READ
            </button>
          </div>
        </div>
      ))}

      {open.length === 0 && (
        <EmptyState
          bordered={false}
          title={
            <>
              No open thoughts <em className="italic text-red">right now.</em>
            </>
          }
          body="Whatever runners write in the general feedback box on their record page lands here, newest first."
        />
      )}

      {resolved.length > 0 && (
        <>
          <div className="mb-4.5 mt-9 font-mono text-[10.4px] font-medium tracking-[0.2em] text-faint">READ</div>
          {resolved.map((f) => (
            <div key={f._id} className="mb-5 flex flex-wrap gap-5 border-b border-dotted border-ink/14 pb-5 opacity-60">
              <div className="min-w-0 flex-0 basis-[120px]">
                <div className="mb-2 font-mono text-[12.6px]">{f.authorHandle}</div>
                <div className="font-mono text-[9.8px] font-medium tracking-[0.12em] text-faint">{relativeTime(f.createdAt)} AGO</div>
              </div>
              <div className="min-w-0 flex-1 basis-[240px] whitespace-pre-wrap font-sans text-[15px] leading-[1.6]">{f.message}</div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
