import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { relativeTime } from '../lib/date'
import { Skel, SkelLines } from '../components/Skeleton'
import { EmptyState } from '../components/EmptyState'

export default function FeedbackAdminPage() {
  const reports = useQuery(api.feedback.listOpenFeedback)
  const resolve = useMutation(api.feedback.resolveFeedback)

  if (reports === null) {
    return <div className="mx-auto max-w-[920px] font-sans text-mute">This page is for the creator only.</div>
  }

  const fieldCounts = new Map<string, number>()
  for (const r of reports ?? []) fieldCounts.set(r.field, (fieldCounts.get(r.field) ?? 0) + 1)
  const worstField = [...fieldCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'

  return (
    <div className="animate-fade mx-auto max-w-[920px]">
      <div className="mb-4.5 flex items-center gap-3">
        <div className="font-mono text-[10.4px] font-medium tracking-[0.2em] text-faint">ERRATA · ADMIN ONLY</div>
        <div className="flex-1 border-b border-ink/16" />
      </div>
      <div className="mb-4 font-serif text-[32px] leading-[1] tracking-[-0.015em] md:text-[52px]">
        What the reader
        <br />
        got wrong
      </div>
      <div className="mb-8 max-w-[58ch] font-sans text-[17.3px] leading-[1.7] text-mute">
        Every misread percentile lands here as a correction. Screenshots are never retained, so each entry carries
        only what the model read and what the runner says was actually on screen.
      </div>

      {reports === undefined ? (
        <>
          <div className="mb-6.5 flex flex-wrap gap-6 md:gap-10" style={{ borderBottom: '1px solid rgba(20,22,26,.14)', paddingBottom: '26px' }}>
            {[0, 1].map((i) => (
              <div key={i}>
                <Skel className="mb-2.5 h-[34px] w-14" />
                <Skel className="h-2.5 w-16" />
              </div>
            ))}
          </div>
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
        </>
      ) : (
        <>
          <div className="mb-6.5 flex flex-wrap gap-6 md:gap-10" style={{ borderBottom: '1px solid rgba(20,22,26,.14)', paddingBottom: '26px' }}>
            <Stat label="OPEN" value={String(reports.length)} />
            <Stat label="WORST FIELD" value={worstField} />
          </div>

          {reports.map((r) => (
            <div key={r._id} className="mb-6 flex flex-wrap gap-5 border-b border-dotted border-ink/20 pb-6">
              <div className="min-w-0 flex-0 basis-[120px]">
                <div className="mb-2 font-mono text-[12.6px]">{r.reporterHandle}</div>
                <div className="font-mono text-[9.8px] font-medium leading-[1.5] tracking-[0.12em] text-faint">
                  LV{r.question?.weekNumber} · S{r.question?.dayNumber}
                  <br />
                  {relativeTime(r.createdAt)} AGO
                </div>
              </div>
              <div className="min-w-0 flex-1 basis-[240px]">
                <div className="mb-3 flex flex-wrap items-baseline gap-2.5">
                  <div className="font-mono text-[10.4px] font-medium tracking-[0.14em] text-mute">{r.field}</div>
                  <div className="font-mono text-[15px] text-mute">extracted:</div>
                  <div className="font-mono text-[15px] text-red">{r.extractedSummary}</div>
                </div>
                <div className="font-sans text-[16.7px] leading-[1.7]">{r.userNote}</div>
                <button
                  onClick={() => void resolve({ reportId: r._id as Id<'feedbackReports'> })}
                  className="mt-3 cursor-pointer border border-ink/28 px-3.5 py-2 font-mono text-[10px] font-medium tracking-[0.14em] text-mute hover:border-ink hover:text-ink"
                >
                  MARK RESOLVED
                </button>
              </div>
            </div>
          ))}
          {reports.length === 0 && (
            <EmptyState
              bordered={false}
              title={
                <>
                  No open corrections <em className="italic text-red">right now.</em>
                </>
              }
              body="Every 'THAT READ IS WRONG' report runners file lands here, sorted newest first, until you mark it resolved."
            />
          )}
        </>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[34px] leading-none text-red">{value}</div>
      <div className="mt-2.5 font-mono text-[9.8px] font-medium tracking-[0.16em] text-mute">{label}</div>
    </div>
  )
}
