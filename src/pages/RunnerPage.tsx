import { Link } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { formatPretty } from '../lib/date'
import { ScoreCell } from '../components/ScoreCell'
import { Skel, SkelLines } from '../components/Skeleton'
import { EmptyState } from '../components/EmptyState'
import { levelColor } from '../lib/levelColor'

export default function RunnerPage({ handle }: { handle: string }) {
  const profile = useQuery(api.profiles.getPublicProfile, { handle })
  const overall = useQuery(api.leaderboard.getOverallLeaderboard)
  const history = useQuery(
    api.submissions.getHistoryForUser,
    profile ? { userId: profile.userId } : 'skip',
  )
  const recent14 = useQuery(
    api.streaks.getRecentDaysForUser,
    profile ? { userId: profile.userId, days: 14 } : 'skip',
  )

  if (profile === null) {
    return (
      <div className="animate-fade mx-auto max-w-[820px]">
        <Link to="/board" className="mb-6 inline-block font-mono text-[10.4px] font-medium tracking-[0.18em] text-mute no-underline">
          ← BACK TO THE BOARD
        </Link>
        <EmptyState
          bordered={false}
          title="Runner not found."
          body={`No one runs under the handle "${handle}".`}
        />
      </div>
    )
  }

  if (profile === undefined) {
    return (
      <div className="animate-fade mx-auto max-w-[820px]">
        <Link to="/board" className="mb-6 inline-block font-mono text-[10.4px] font-medium tracking-[0.18em] text-mute no-underline">
          ← BACK TO THE BOARD
        </Link>
        <Skel className="mb-4 h-[60px] w-64" />
        <div className="mb-9 grid grid-cols-2 border border-ink/16 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="border-r border-b border-ink/10 px-4 py-4.5">
              <Skel className="mb-3.5 h-2.5 w-16" />
              <Skel className="h-5 w-20" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const rank = overall?.find((r) => r.handle === profile.handle)?.rank

  return (
    <div className="animate-fade mx-auto max-w-[820px]">
      <Link to="/board" className="mb-6 inline-block font-mono text-[10.4px] font-medium tracking-[0.18em] text-mute no-underline">
        ← BACK TO THE BOARD
      </Link>

      <div className="mb-4 font-mono text-[10.4px] font-medium tracking-[0.2em] text-faint">
        RUNNER · JOINED {new Date(profile.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()}
      </div>
      <div className="mb-6.5 font-serif text-[38px] leading-[0.96] tracking-[-0.015em] md:text-[60px]">
        {profile.handle}
      </div>

      <div className="mb-9 grid grid-cols-2 border border-ink/16 bg-paper sm:grid-cols-4">
        {[
          { k: 'RANK', v: rank !== undefined ? `${String(rank).padStart(2, '0')} / ${overall?.length}` : '—' },
          { k: 'CURRENT STREAK', v: `${profile.currentStreak}d`, c: '#C98A0B' },
          { k: 'LONGEST STREAK', v: `${profile.longestStreak}d` },
          { k: 'TOTAL XP', v: <ScoreCell value={profile.totalScore} /> },
        ].map((r) => (
          <div key={r.k} className="border-r border-b border-ink/10 px-4 py-4.5">
            <div className="font-mono text-[9.8px] font-medium tracking-[0.16em] text-faint">{r.k}</div>
            <div className="mt-3.5 font-mono text-[19px] md:text-[23px]" style={{ color: r.c ?? '#14161A' }}>
              {r.v}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-9">
        <div className="mb-4.5 font-mono text-[10.4px] font-medium tracking-[0.2em] text-faint">THE LAST 14 DAYS</div>
        {recent14 === undefined ? (
          <div className="flex gap-1.5">
            {Array.from({ length: 14 }, (_, i) => <Skel key={i} className="h-14 flex-1" />)}
          </div>
        ) : (
          <div className="flex gap-1.5">
            {recent14.map((d) => {
              const bg = d.status === 'cleared' ? '#14161A' : d.status === 'freeze' ? '#1D4ED8' : '#FFFFFF'
              const symbol = d.status === 'freeze' ? '❄' : d.status === 'cleared' ? '✓' : ''
              return (
                <div key={d.date} className="min-w-0 flex-1">
                  <div
                    className="flex h-14 items-end justify-center pb-1.5 font-mono text-[11px]"
                    style={{ background: bg, border: '1px solid rgba(20,22,26,.16)', color: d.status === 'missed' || d.status === 'unplayed' ? '#9A9CA1' : '#FBFBF8' }}
                  >
                    {symbol}
                  </div>
                  <div className="mt-1.5 text-center font-mono text-[9px] font-medium text-faint">{d.date.slice(8)}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="mb-4 font-mono text-[10.4px] font-medium tracking-[0.2em] text-faint">RECENT SUBMISSIONS</div>
      {history === undefined &&
        Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex flex-wrap items-baseline gap-3.5 border-b border-dotted border-ink/20 py-3.5">
            <Skel className="h-3 w-11" />
            <div className="min-w-0 flex-1 basis-[180px]">
              <SkelLines count={2} lastWidth="w-1/3" />
            </div>
          </div>
        ))}
      {history?.length === 0 && (
        <EmptyState bordered={false} title="No submissions yet." body="This runner hasn't cleared a stage yet." />
      )}
      {history?.map(({ submission, question }) => (
        <div key={submission._id} className="flex flex-wrap items-baseline gap-3.5 border-b border-dotted border-ink/20 py-3.5">
          <div
            className="w-14.5 font-mono text-[10.4px] font-medium tracking-[0.1em]"
            style={{ color: question ? levelColor(question.weekNumber) : '#9A9CA1' }}
          >
            L{question?.weekNumber}·S{question?.dayNumber}
          </div>
          <div className="min-w-0 flex-1 basis-[180px]">
            <div className="font-serif text-[19.5px] leading-[1.25] md:text-[23px]">{question?.title}</div>
            <div className="mt-1.5 font-mono text-[9.8px] font-medium tracking-[0.12em] text-faint">
              {question ? formatPretty(question.date) : ''} · {submission.runtimeValue} · {submission.memoryValue}
            </div>
          </div>
          <div className="flex flex-0 basis-[200px] items-center gap-2.5">
            <div className="relative h-1.5 flex-1 bg-ink/8">
              <div
                className="absolute inset-y-0 left-0"
                style={{
                  width: `${submission.runtimePercentile}%`,
                  background: submission.runtimePercentile >= 90 ? '#0A7A52' : submission.runtimePercentile >= 70 ? '#14161A' : '#C8362B',
                }}
              />
            </div>
            <div className="w-13 text-right font-mono text-[13.8px]">{submission.runtimePercentile.toFixed(1)}%</div>
            <div className="w-13 text-right font-mono text-[13.8px] text-faint">{submission.memoryPercentile.toFixed(1)}%</div>
          </div>
        </div>
      ))}
    </div>
  )
}
