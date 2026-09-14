import { type ReactNode, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { GLYPH } from '../lib/glyphs'
import { todayLocalStr } from '../lib/date'
import { Skel } from './Skeleton'

type NavItem = { key: string; num: string; label: string; icon: string; to: string }

const NAV_COLOR: Record<string, string> = {
  today: '#C8362B',
  weeks: '#6D28D9',
  board: '#C98A0B',
  reveal: '#1D4ED8',
  profile: '#0A7A52',
  admin: '#0F8B8D',
}

const NAV: NavItem[] = [
  { key: 'today', num: '1', label: "Today's stage", icon: GLYPH.stage, to: '/today' },
  { key: 'weeks', num: '2', label: 'The tree', icon: GLYPH.tree, to: '/weeks' },
  { key: 'board', num: '3', label: 'The board', icon: GLYPH.board, to: '/board' },
  { key: 'reveal', num: '4', label: 'Weekly reveal', icon: GLYPH.reveal, to: '/reveal' },
  { key: 'profile', num: '5', label: 'Your record', icon: GLYPH.you, to: '/profile' },
]

const TABS = [
  { key: 'today', label: 'STAGE', icon: GLYPH.stage, to: '/today' },
  { key: 'weeks', label: 'TREE', icon: GLYPH.tree, to: '/weeks' },
  { key: 'board', label: 'BOARD', icon: GLYPH.board, to: '/board' },
  { key: 'reveal', label: 'REVEAL', icon: GLYPH.reveal, to: '/reveal' },
  { key: 'profile', label: 'YOU', icon: GLYPH.you, to: '/profile' },
]

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const today = todayLocalStr()

  const profile = useQuery(api.profiles.getMyProfile)
  const todayCtx = useQuery(api.syllabus.getTodayContext, { today })
  const recentWeek = useQuery(api.streaks.getMyRecentDays, { days: 7 })
  const overall = useQuery(api.leaderboard.getOverallLeaderboard)

  const weekNumber = todayCtx?.week?.weekNumber
  const myRank = overall?.find((r) => r.handle === profile?.handle)?.rank

  const prevStreakRef = useRef<number | undefined>(undefined)
  const [streakBump, setStreakBump] = useState(false)
  useEffect(() => {
    if (!profile) return
    const prev = prevStreakRef.current
    prevStreakRef.current = profile.currentStreak
    if (prev !== undefined && profile.currentStreak > prev) {
      setStreakBump(true)
      const t = setTimeout(() => setStreakBump(false), 1100)
      return () => clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.currentStreak])

  const activeKey = (() => {
    const p = location.pathname
    if (p.startsWith('/today') || p.startsWith('/question')) return 'today'
    if (p.startsWith('/level')) return 'weeks'
    if (p.startsWith('/weeks')) return 'weeks'
    if (p.startsWith('/board')) return 'board'
    if (p.startsWith('/reveal')) return 'reveal'
    if (p.startsWith('/profile')) return 'profile'
    if (p.startsWith('/admin')) return 'admin'
    if (p.startsWith('/comments')) return 'today'
    return ''
  })()

  const resolvedNav = [...NAV]
  if (profile?.isAdmin) {
    resolvedNav.push({ key: 'admin', num: '6', label: 'Admin', icon: GLYPH.admin, to: '/admin' })
  }

  const statusBits = [
    { t: 'SEASON 01', fg: '#8E9197' },
    ...(todayCtx?.week ? [{ t: `LV ${String(weekNumber).padStart(2, '0')} · ${todayCtx.week.topic.toUpperCase()}`, fg: '#E8E9E6' }] : []),
    ...(todayCtx?.question ? [{ t: `STAGE ${todayCtx.question.dayNumber}/7`, fg: '#8E9197' }] : []),
    ...(profile ? [{ t: `STREAK ${profile.currentStreak}`, fg: '#F0C27A' }] : []),
    ...(myRank !== undefined ? [{ t: `RANK ${String(myRank).padStart(2, '0')}`, fg: '#8E9197' }] : []),
    ...(profile ? [{ t: `XP ${profile.totalScore.toLocaleString()}`, fg: '#8E9197' }] : []),
  ]

  return (
    <div className="flex min-h-screen flex-col bg-graph font-sans text-ink md:h-screen md:overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center gap-0 border-b border-ink/16 bg-ink px-3 text-[#8E9197] md:px-5">
        {statusBits.map((b, i) => (
          <div
            key={i}
            className="mr-3.5 border-r border-ground/14 py-2.5 pr-3.5 font-mono text-[10.4px] font-medium tracking-[0.14em]"
            style={{ color: b.fg }}
          >
            {b.t}
          </div>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="hidden w-[214px] shrink-0 flex-col gap-5.5 overflow-y-auto border-r border-ink/14 py-6 md:flex">
          <Link to="/" className="px-5 font-mono text-[10.4px] font-medium tracking-[0.2em] text-faint">
            {GLYPH.back} DSA&nbsp;JOURNEY
          </Link>
          <div>
            <div className="px-5 pb-2.5 font-mono text-[9.8px] font-medium tracking-[0.2em] text-faint">INDEX</div>
            {resolvedNav.map((n) => {
              const on = n.key === activeKey
              const color = NAV_COLOR[n.key] ?? '#14161A'
              return (
                <Link
                  key={n.key}
                  to={n.to}
                  className="flex items-baseline gap-2.5 border-l-2 px-5 py-2.5 no-underline hover:bg-ink/4"
                  style={{ borderLeftColor: on ? color : 'transparent', background: on ? `${color}0D` : 'transparent' }}
                >
                  <div className="w-4 shrink-0 text-center font-mono text-[13px]" style={{ color, opacity: on ? 1 : 0.55 }}>
                    {n.icon}
                  </div>
                  <div className={`font-sans text-[15.5px] ${on ? 'font-medium text-ink' : 'font-normal text-mute'}`}>
                    {n.label}
                  </div>
                  <div className="flex-1 border-b border-dotted border-ink/22" style={{ transform: 'translateY(-4px)' }} />
                  {on && (
                    <div className="font-mono text-[10.4px]" style={{ color }}>
                      {GLYPH.cleared}
                    </div>
                  )}
                </Link>
              )
            })}
          </div>

          <div className="mt-auto border-t border-ink/14 px-5 pt-4.5">
            {profile && recentWeek ? (
              <>
                <div className="mb-3 flex items-baseline gap-2.5">
                  <div
                    className={`relative font-mono text-[36px] leading-[1.15] ${streakBump ? 'animate-streak-pop' : ''}`}
                    style={{ color: '#C98A0B' }}
                  >
                    {profile.currentStreak}
                    {streakBump && (
                      <span
                        className="animate-float-up pointer-events-none absolute -top-1 -right-4.5 font-mono text-[13px] font-bold"
                        style={{ color: '#C98A0B' }}
                      >
                        +1
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-[10px] font-medium leading-[1.35] tracking-[0.14em] text-mute">
                    DAY
                    <br />
                    STREAK
                  </div>
                </div>
                <div className="mb-2.5 flex gap-[3px]">
                  {recentWeek.map((d) => {
                    const bg = d.status === 'cleared' ? '#14161A' : d.status === 'freeze' ? '#1D4ED8' : '#FBFBF8'
                    const fg = d.status === 'unplayed' || d.status === 'missed' ? '#9A9CA1' : '#FBFBF8'
                    const weekday = new Date(d.date + 'T00:00:00Z').getUTCDay()
                    return (
                      <div
                        key={d.date}
                        className="flex h-7 flex-1 items-center justify-center border font-mono text-[9.5px] font-medium"
                        style={{ background: bg, color: fg, borderColor: d.status === 'unplayed' ? 'rgba(20,22,26,.25)' : 'transparent' }}
                      >
                        {DAY_LETTERS[(weekday + 6) % 7]}
                      </div>
                    )
                  })}
                </div>
                <div className="font-sans text-[13px] leading-[1.5] text-mute">
                  {profile.freezesRemaining} freeze{profile.freezesRemaining === 1 ? '' : 's'} left · longest run{' '}
                  {profile.longestStreak}
                </div>
              </>
            ) : (
              <>
                <Skel className="mb-3 h-9 w-14" />
                <div className="mb-2.5 flex gap-[3px]">
                  {Array.from({ length: 7 }, (_, i) => (
                    <Skel key={i} className="h-7 flex-1" />
                  ))}
                </div>
                <Skel className="h-3 w-32" />
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5.5 md:p-11">{children}</div>

        <div className="sticky bottom-0 z-40 flex shrink-0 border-t border-ink/18 bg-ground/97 backdrop-blur md:hidden">
          {TABS.map((t) => {
            const on = t.key === activeKey
            const color = NAV_COLOR[t.key] ?? '#14161A'
            return (
              <button
                key={t.key}
                onClick={() => navigate(t.to)}
                className="flex flex-1 cursor-pointer flex-col items-center gap-1.5 border-t-2 py-3 pb-4"
                style={{ borderTopColor: on ? color : 'transparent', color: on ? color : '#9A9CA1', opacity: on ? 1 : 0.75 }}
              >
                <div className="font-mono text-[13.8px]">{t.icon}</div>
                <div className="font-mono text-[9.2px] font-medium tracking-[0.1em]">{t.label}</div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
