import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { relativeTime } from '../../lib/date'
import { Skel, SkelLines } from '../../components/Skeleton'
import { EmptyState } from '../../components/EmptyState'

export function ExtractionFailuresTab() {
  const failures = useQuery(api.admin.getExtractionFailures)

  if (failures === undefined) {
    return (
      <div>
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="mb-6 flex flex-wrap gap-5 border-b border-dotted border-ink/20 pb-6">
            <div className="min-w-0 flex-0 basis-[120px]">
              <Skel className="h-3 w-16" />
            </div>
            <div className="min-w-0 flex-1 basis-[240px]">
              <SkelLines count={2} lastWidth="w-1/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (failures === null) {
    return <div className="font-sans text-mute">This page is for the creator only.</div>
  }

  return (
    <div>
      <div className="mb-6 font-mono text-[10.4px] font-medium tracking-[0.2em] text-faint">
        {failures.length} FAILED READ{failures.length === 1 ? '' : 'S'} · MOST RECENT FIRST
      </div>
      {failures.map((f) => (
        <div key={f._id} className="mb-6 flex flex-wrap gap-5 border-b border-dotted border-ink/20 pb-6">
          <div className="min-w-0 flex-0 basis-[120px]">
            <div className="mb-2 font-mono text-[12.6px]">{f.reporterHandle}</div>
            <div className="font-mono text-[9.8px] font-medium leading-[1.5] tracking-[0.12em] text-faint">
              {f.question ? (
                <>
                  LV{f.question.weekNumber} · S{f.question.dayNumber}
                  <br />
                </>
              ) : null}
              {relativeTime(f.createdAt)} AGO
            </div>
          </div>
          <div className="min-w-0 flex-1 basis-[240px] font-sans text-[15.5px] leading-[1.65]">{f.reason}</div>
        </div>
      ))}
      {failures.length === 0 && (
        <EmptyState
          bordered={false}
          title={
            <>
              No failed reads <em className="italic text-red">right now.</em>
            </>
          }
          body="Every screenshot the vision model couldn't confidently read lands here, newest first."
        />
      )}
    </div>
  )
}
