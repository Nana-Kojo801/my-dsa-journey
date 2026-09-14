import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Skel } from '../../components/Skeleton'
import { ScoreCell } from '../../components/ScoreCell'

const INK = '#14161A'
const RED = '#C8362B'

function Stat({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) {
  return (
    <div className="border-r border-b border-ink/10 px-4 py-4.5">
      <div className="font-mono text-[9.8px] font-medium tracking-[0.16em] text-faint">{label}</div>
      <div className="mt-3.5 font-mono text-[20px] md:text-[23px]" style={{ color: color ?? INK }}>
        {value}
      </div>
    </div>
  )
}

function BarChart({ title, data }: { title: string; data: { date: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count))
  return (
    <div className="min-w-0 flex-1 basis-[300px]">
      <div className="mb-4.5 font-mono text-[10.4px] font-medium tracking-[0.2em] text-faint">{title}</div>
      <div className="flex h-[120px] items-end gap-1.5 border-b border-ink/34">
        {data.map((d) => (
          <div key={d.date} className="flex h-full flex-1 flex-col items-end justify-end gap-1">
            <div className="font-mono text-[9px] text-faint">{d.count > 0 ? d.count : ''}</div>
            <div
              className="w-full"
              style={{ height: `${Math.max(3, Math.round((d.count / max) * 100))}%`, background: 'rgba(20,22,26,.14)', borderTop: `2px solid ${INK}` }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 pt-2">
        {data.map((d) => (
          <div key={d.date} className="flex-1 text-center font-mono text-[9px] text-faint">
            {d.date.slice(8)}
          </div>
        ))}
      </div>
    </div>
  )
}

export function OverviewTab() {
  const stats = useQuery(api.admin.getStats)
  const runners = useQuery(api.admin.getAllRunners)

  if (stats === undefined) {
    return (
      <div>
        <div className="mb-8 grid grid-cols-2 border border-ink/16 bg-paper sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="border-r border-b border-ink/10 px-4 py-4.5">
              <Skel className="mb-3.5 h-2.5 w-16" />
              <Skel className="h-5 w-14" />
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-8">
          {[0, 1].map((i) => (
            <div key={i} className="min-w-0 flex-1 basis-[300px]">
              <Skel className="mb-4.5 h-2.5 w-32" />
              <Skel className="h-[120px] w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (stats === null) {
    return <div className="font-sans text-mute">This page is for the creator only.</div>
  }

  const pct = (n: number) => `${Math.round(n * 100)}%`

  return (
    <div>
      <div className="mb-8.5 grid grid-cols-2 border border-ink/16 bg-paper sm:grid-cols-3 md:grid-cols-4">
        <Stat label="TOTAL RUNNERS" value={stats.totalUsers} />
        <Stat label="NEW · 7 DAYS" value={stats.newUsers7d} color="#0A7A52" />
        <Stat label="NEW · 30 DAYS" value={stats.newUsers30d} color="#0A7A52" />
        <Stat label="ACTIVE STREAKS" value={stats.activeStreaks} color="#1D4ED8" />
        <Stat label="AVG SCORE" value={Math.round(stats.avgScore)} />
        <Stat label="LONGEST STREAK EVER" value={`${stats.longestStreakEver}d`} />
        <Stat label="SUBMISSIONS TOTAL" value={stats.totalSubmissions} />
        <Stat label="SUBMISSIONS TODAY" value={stats.submissionsToday} color={RED} />
        <Stat label="READ SUCCESS RATE" value={pct(stats.extractionSuccessRate)} color={stats.extractionSuccessRate < 0.85 ? RED : '#0A7A52'} />
        <Stat label="OPEN FEEDBACK" value={stats.openFeedbackCount + stats.openSiteFeedbackCount} color={RED} />
        <Stat label="COMMENTS POSTED" value={stats.commentsCount} />
        <Stat label="PUSH SUBSCRIBERS" value={stats.pushSubscriberCount} />
      </div>

      <div className="mb-8.5 flex flex-wrap gap-8 border-b border-ink/14 pb-8">
        <BarChart title="SIGNUPS · LAST 14 DAYS" data={stats.signupsByDay} />
        <BarChart title="SUBMISSIONS · LAST 14 DAYS" data={stats.submissionsByDay} />
      </div>

      <div className="mb-4.5 font-mono text-[10.4px] font-medium tracking-[0.2em] text-faint">TOP RUNNERS</div>
      {runners === undefined ? (
        <Skel className="h-[140px] w-full" />
      ) : runners === null ? null : (
        <div className="flex items-baseline gap-2.5 border-b border-ink/30 pb-2.5 font-mono text-[9.8px] font-medium tracking-[0.16em] text-faint">
          <div className="w-8.5">#</div>
          <div className="flex-1">HANDLE</div>
          <div className="w-16 text-right">STREAK</div>
          <div className="w-16 text-right">SCORE</div>
        </div>
      )}
      {runners?.slice(0, 5).map((r) => (
        <div key={r.handle} className="flex items-baseline gap-2.5 border-b border-dotted border-ink/20 py-2.5">
          <div className="w-8.5 font-mono text-[11.5px] text-faint">[{String(r.rank).padStart(2, '0')}]</div>
          <div className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-sans text-[15px] font-medium">{r.handle}</div>
          <div className="w-16 text-right font-mono text-[12.6px] text-mute">{r.currentStreak}d</div>
          <ScoreCell value={r.totalScore} className="w-16 text-right font-mono text-[16px]" />
        </div>
      ))}
    </div>
  )
}
