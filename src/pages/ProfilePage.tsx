import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAction, useMutation, useQuery } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import { ConvexError } from 'convex/values'
import { api } from '../../convex/_generated/api'
import { todayLocalStr, formatPretty } from '../lib/date'
import { useToast } from '../lib/toastContext'
import { PrimaryButton } from '../components/ui'
import { getActivePushEndpoint, getPushPermissionState, subscribeToPush, unsubscribeFromPush } from '../lib/push'
import { Skel } from '../components/Skeleton'
import { EmptyState } from '../components/EmptyState'
import { ScoreCell } from '../components/ScoreCell'
import { levelColor } from '../lib/levelColor'

export default function ProfilePage() {
  const flash = useToast()
  const today = todayLocalStr()
  const { signOut } = useAuthActions()

  const profile = useQuery(api.profiles.getMyProfile)
  const history = useQuery(api.submissions.getMyHistory)
  const recent14 = useQuery(api.streaks.getMyRecentDays, { days: 14 })
  const recent56 = useQuery(api.streaks.getMyRecentDays, { days: 56 })
  const overall = useQuery(api.leaderboard.getOverallLeaderboard)
  const todayCtx = useQuery(api.syllabus.getTodayContext, { today })
  const renameHandle = useMutation(api.profiles.renameHandle)
  const subscribePush = useMutation(api.pushSubscriptions.subscribe)
  const unsubscribePush = useMutation(api.pushSubscriptions.unsubscribe)
  const submitGeneralFeedback = useMutation(api.feedback.submitGeneralFeedback)
  const changePassword = useAction(api.profiles.changePassword)

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [pushState, setPushState] = useState<NotificationPermission | 'unsupported'>('default')
  const [pushSubscribed, setPushSubscribed] = useState(false)
  const [feedbackDraft, setFeedbackDraft] = useState('')
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    void getPushPermissionState().then(setPushState)
    void getActivePushEndpoint().then((endpoint) => setPushSubscribed(endpoint !== null))
  }, [])

  const enablePush = async () => {
    const sub = await subscribeToPush()
    if (sub === null) {
      flash('NOTIFICATIONS BLOCKED OR UNSUPPORTED')
      return
    }
    await subscribePush(sub)
    setPushState('granted')
    setPushSubscribed(true)
    flash('NOTIFICATIONS ON')
  }

  const disablePush = async () => {
    const endpoint = await unsubscribeFromPush()
    if (endpoint) await unsubscribePush({ endpoint })
    setPushSubscribed(false)
    flash('NOTIFICATIONS OFF')
  }

  const sendGeneralFeedback = async () => {
    const message = feedbackDraft.trim()
    if (!message) return flash('WRITE SOMETHING FIRST')
    await submitGeneralFeedback({ message })
    setFeedbackDraft('')
    setFeedbackSent(true)
    flash('FEEDBACK SENT')
  }

  const savePassword = async () => {
    if (!currentPassword) return flash('ENTER YOUR CURRENT PASSPHRASE')
    if (newPassword.length < 8) return flash('NEW PASSPHRASE NEEDS 8+ CHARACTERS')
    try {
      await changePassword({ currentPassword, newPassword })
      setChangingPassword(false)
      setCurrentPassword('')
      setNewPassword('')
      flash('PASSPHRASE UPDATED')
    } catch (e) {
      flash(e instanceof ConvexError && typeof e.data === 'string' ? e.data.toUpperCase() : 'COULD NOT UPDATE PASSPHRASE')
    }
  }

  if (profile === null) return null

  const rank = overall?.find((r) => r.handle === profile?.handle)?.rank
  const xpByWeek = new Map<number, number>()
  for (const h of history ?? []) {
    if (h.question) xpByWeek.set(h.question.weekNumber, (xpByWeek.get(h.question.weekNumber) ?? 0) + h.submission.bestScore)
  }
  const maxWeek = todayCtx?.week?.weekNumber ?? Math.max(1, ...xpByWeek.keys())
  const xpBars = Array.from({ length: maxWeek }, (_, i) => ({ label: `L${i + 1}`, value: xpByWeek.get(i + 1) ?? 0 }))
  const xpMax = Math.max(1, ...xpBars.map((b) => b.value))

  const save = async () => {
    const v = draft.trim().toLowerCase()
    if (v.length < 3) return flash('HANDLE NEEDS 3+ CHARACTERS')
    try {
      await renameHandle({ newHandle: v })
      setEditing(false)
      flash(`HANDLE UPDATED · ${v.toUpperCase()}`)
    } catch (e) {
      flash(e instanceof Error ? e.message.toUpperCase() : 'COULD NOT SAVE')
    }
  }

  return (
    <div className="animate-fade mx-auto max-w-[1080px]">
      <div className="mb-6.5 border-b border-ink/14 pb-6.5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="font-mono text-[10.4px] font-medium tracking-[0.2em] text-faint">
            HANDLE{profile && <> · JOINED {new Date(profile.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()}</>}
          </div>
          {profile?.isAdmin && (
            <Link
              to="/admin"
              className="cursor-pointer border border-ink/28 px-3.5 py-2 font-mono text-[10.4px] font-medium tracking-[0.16em] text-mute no-underline hover:border-ink hover:text-ink md:hidden"
            >
              ADMIN →
            </Link>
          )}
        </div>
        {profile === undefined ? (
          <Skel className="h-[38px] w-64 md:h-[60px]" />
        ) : !editing ? (
          <div className="flex flex-wrap items-center gap-4.5">
            <div className="font-serif text-[38px] leading-[0.96] tracking-[-0.015em] md:text-[60px]">{profile.handle}</div>
            <button
              onClick={() => {
                setDraft(profile.handle)
                setEditing(true)
              }}
              className="cursor-pointer border border-ink/28 px-3.5 py-2.5 font-mono text-[10.4px] font-medium tracking-[0.16em] text-mute hover:border-ink hover:text-ink"
            >
              CHANGE HANDLE
            </button>
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap items-center gap-4">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="min-w-[260px] flex-1 border-0 border-b-2 border-red bg-transparent px-0.5 py-2 font-serif text-[36px] leading-[1.1] outline-none md:text-[46px]"
              />
              <div className="flex items-center gap-4">
                <PrimaryButton onClick={() => void save()}>SAVE</PrimaryButton>
                <button onClick={() => setEditing(false)} className="cursor-pointer font-mono text-[11px] font-medium tracking-[0.16em] text-mute">
                  CANCEL
                </button>
              </div>
            </div>
            <div className="mt-3.5 font-sans text-[13.5px] leading-[1.6] text-mute">
              Lowercase, numbers and underscores. Changing it renames you everywhere on the board — your history follows.
            </div>
          </div>
        )}

        {profile && (
          <div className="mt-5.5">
            {!changingPassword ? (
              <button
                onClick={() => setChangingPassword(true)}
                className="cursor-pointer font-mono text-[10.4px] font-medium tracking-[0.16em] text-mute hover:text-ink"
              >
                CHANGE PASSPHRASE
              </button>
            ) : (
              <div className="max-w-[380px]">
                <div className="mb-2.5 font-mono text-[10.4px] font-medium tracking-[0.18em] text-mute">CURRENT PASSPHRASE</div>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mb-4 w-full border-0 border-b border-ink/30 bg-transparent px-0.5 py-2 font-mono text-[16px] outline-none focus:border-red"
                />
                <div className="mb-2.5 font-mono text-[10.4px] font-medium tracking-[0.18em] text-mute">NEW PASSPHRASE</div>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mb-4 w-full border-0 border-b border-ink/30 bg-transparent px-0.5 py-2 font-mono text-[16px] outline-none focus:border-red"
                />
                <div className="flex items-center gap-4">
                  <PrimaryButton onClick={() => void savePassword()}>SAVE PASSPHRASE</PrimaryButton>
                  <button
                    onClick={() => {
                      setChangingPassword(false)
                      setCurrentPassword('')
                      setNewPassword('')
                    }}
                    className="cursor-pointer font-mono text-[11px] font-medium tracking-[0.16em] text-mute"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {profile === undefined ? (
        <div className="mb-9 grid grid-cols-2 border border-ink/16 bg-paper sm:grid-cols-3 md:grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="border-r border-b border-ink/10 px-4 py-4.5">
              <Skel className="mb-3.5 h-2.5 w-16" />
              <Skel className="h-5 w-20" />
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-9 grid grid-cols-2 border border-ink/16 bg-paper sm:grid-cols-3 md:grid-cols-5">
          {[
            { k: 'POSITION', v: todayCtx?.week ? `LV ${todayCtx.week.weekNumber} · S${todayCtx.question?.dayNumber}` : '—' },
            { k: 'RANK', v: rank !== undefined ? `${String(rank).padStart(2, '0')} / ${overall?.length}` : '—' },
            { k: 'CURRENT STREAK', v: `${profile.currentStreak} DAYS`, c: '#C98A0B' },
            { k: 'FREEZES', v: `${profile.freezesRemaining} LEFT`, c: '#1D4ED8' },
            { k: 'TOTAL XP', v: <ScoreCell value={profile.totalScore} /> },
          ].map((r, i) => (
            <div key={r.k} className={`border-r border-b border-ink/10 px-4 py-4.5 ${i === 4 ? 'col-span-2 sm:col-span-1' : ''}`}>
              <div className="font-mono text-[9.8px] font-medium tracking-[0.16em] text-faint">{r.k}</div>
              <div className="mt-3.5 font-mono text-[19px] md:text-[23px]" style={{ color: r.c ?? '#14161A' }}>
                {r.v}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mb-9 flex flex-wrap items-stretch gap-6 md:gap-9">
        <div
          className="flex w-full flex-col p-6 text-ground md:w-auto md:min-w-[218px] md:flex-0 md:basis-[262px]"
          style={{ background: 'linear-gradient(135deg, #C98A0B, #C8362B)' }}
        >
          <div className="font-mono text-[10.4px] font-medium tracking-[0.2em] text-[#FFE4BE]">CURRENT STREAK</div>
          {profile === undefined ? (
            <Skel dark className="my-4.5 h-[58px] w-24 md:h-[84px]" />
          ) : (
            <>
              <div className="my-4.5 flex items-baseline gap-2.5">
                <div className="font-mono text-[58px] leading-[0.86] md:text-[84px]">{profile.currentStreak}</div>
                <div className="font-mono text-[11px] font-medium tracking-[0.14em] text-[#FFE4BE]">DAYS</div>
              </div>
              <div className="mt-auto flex flex-wrap gap-6 border-t border-ground/25 pt-5.5">
                <div>
                  <div className="mb-2 font-mono text-[9.8px] font-medium tracking-[0.14em] text-[#FFE4BE]">LONGEST</div>
                  <div className="font-mono text-[21px]">{profile.longestStreak}d</div>
                </div>
                <div>
                  <div className="mb-2 font-mono text-[9.8px] font-medium tracking-[0.14em] text-[#FFE4BE]">FREEZES</div>
                  <div className="font-mono text-[21px]">{profile.freezesRemaining} left</div>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="min-w-0 flex-1 basis-[340px]">
          <div className="mb-4.5 font-mono text-[10.4px] font-medium tracking-[0.2em] text-faint">THE LAST FOURTEEN DAYS</div>
          {recent14 === undefined ? (
            <div className="flex gap-1.5">
              {Array.from({ length: 14 }, (_, i) => (
                <Skel key={i} className="h-14 flex-1" />
              ))}
            </div>
          ) : (
            <>
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
              <div className="mt-5 flex flex-wrap gap-5">
                <Legend color="#14161A" label="CLEARED" />
                <Legend color="#1D4ED8" label="FREEZE SPENT" />
                <Legend color="#FFFFFF" border label="MISSED" />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mb-9 flex flex-wrap items-start gap-6 md:gap-10">
        <div className="min-w-0 flex-1 basis-[300px]">
          <div className="mb-4.5 font-mono text-[10.4px] font-medium tracking-[0.2em] text-faint">EIGHT WEEKS · DAILY OUTCOME</div>
          {recent56 === undefined ? (
            <div className="flex max-w-[420px] flex-wrap gap-1">
              {Array.from({ length: 56 }, (_, i) => (
                <Skel key={i} className="h-[15px] w-[15px]" />
              ))}
            </div>
          ) : (
            <>
              <div className="flex max-w-[420px] flex-wrap gap-1">
                {recent56.map((h) => {
                  const bg =
                    h.status === 'freeze' ? '#1D4ED8' : h.status === 'cleared' ? '#0A7A52' : h.status === 'missed' ? '#FFFFFF' : '#F4F3EE'
                  return <div key={h.date} title={`${h.date} · ${h.status}`} className="h-[15px] w-[15px] border border-ink/16" style={{ background: bg }} />
                })}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <div className="font-mono text-[9.8px] font-medium tracking-[0.12em] text-faint">MISSED</div>
                <div className="h-3.5 w-3.5 border border-ink/16 bg-white" />
                <div className="h-3.5 w-3.5 border border-ink/16" style={{ background: '#0A7A52' }} />
                <div className="font-mono text-[9.8px] font-medium tracking-[0.12em] text-faint">CLEARED</div>
              </div>
            </>
          )}
        </div>
        <div className="min-w-0 flex-1 basis-[240px]">
          <div className="mb-4.5 font-mono text-[10.4px] font-medium tracking-[0.2em] text-faint">XP BY LEVEL</div>
          {history === undefined ? (
            <div className="flex h-[120px] items-end gap-1.5 border-b border-ink/34">
              {[45, 70, 55, 85, 60, 95, 40].map((h, i) => (
                <Skel key={i} className="flex-1" style={{ height: `${h}%` }} />
              ))}
            </div>
          ) : (
            <>
              <div className="flex h-[120px] items-end gap-1.5 border-b border-ink/34">
                {xpBars.map((b, i) => {
                  const color = levelColor(i + 1)
                  const isCurrentLevel = b.label === `L${maxWeek}`
                  return (
                    <div
                      key={b.label}
                      className="flex-1"
                      style={{
                        height: `${Math.max(3, Math.round((b.value / xpMax) * 100))}%`,
                        background: isCurrentLevel ? color : `${color}30`,
                        borderTop: `2px solid ${color}`,
                      }}
                    />
                  )
                })}
              </div>
              <div className="flex gap-1.5 pt-2">
                {xpBars.map((b) => (
                  <div key={b.label} className="flex-1 text-center font-mono text-[9.2px] text-faint">
                    {b.label}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {pushState !== 'unsupported' && (
        <div className="mb-9 flex flex-wrap items-center justify-between gap-4 border border-ink/16 bg-paper px-5 py-4.5">
          <div>
            <div className="flex items-center gap-2.5 font-mono text-[10.4px] font-medium tracking-[0.16em] text-faint">
              NOTIFICATIONS
              <span
                className="inline-flex items-center gap-1.5 font-mono text-[9.5px] font-medium tracking-[0.12em]"
                style={{ color: pushState === 'granted' && pushSubscribed ? '#0A7A52' : '#9A9CA1' }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: pushState === 'granted' && pushSubscribed ? '#0A7A52' : '#9A9CA1' }}
                />
                {pushState === 'granted' && pushSubscribed ? 'ON' : 'OFF'}
              </span>
            </div>
            <div className="mt-1.5 font-sans text-[14px] text-mute">
              {pushState === 'denied'
                ? 'Blocked at the browser level. Allow notifications for this site to turn them back on.'
                : 'Get a nudge when today’s stage is still open, or when someone passes you on the board.'}
            </div>
          </div>
          {pushState === 'granted' && pushSubscribed ? (
            <PrimaryButton onClick={() => void disablePush()}>TURN OFF</PrimaryButton>
          ) : (
            <PrimaryButton onClick={() => void enablePush()} disabled={pushState === 'denied'}>
              TURN ON
            </PrimaryButton>
          )}
        </div>
      )}

      <div className="mb-9 border border-ink/16 bg-paper px-5 py-4.5">
        <div className="font-mono text-[10.4px] font-medium tracking-[0.16em] text-faint">GENERAL FEEDBACK</div>
        <div className="mt-1.5 mb-4 font-sans text-[14px] text-mute">
          Bug, idea, or just a thought on how the app feels to use — it goes straight to the creator.
        </div>
        {feedbackSent ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="font-sans text-[14.5px] text-mute">
              Thanks — that's logged. <span className="text-ink">Send another?</span>
            </div>
            <button
              onClick={() => setFeedbackSent(false)}
              className="cursor-pointer border border-ink/28 px-3.5 py-2 font-mono text-[10px] font-medium tracking-[0.14em] text-mute hover:border-ink hover:text-ink"
            >
              WRITE ANOTHER
            </button>
          </div>
        ) : (
          <>
            <textarea
              value={feedbackDraft}
              onChange={(e) => setFeedbackDraft(e.target.value)}
              placeholder="What's working, what's not, what you'd change…"
              className="w-full min-h-[72px] resize-y border border-ink/20 bg-ground p-3 font-sans text-[15px] leading-[1.6] outline-none focus:border-red"
            />
            <div className="mt-3 flex justify-end">
              <PrimaryButton onClick={() => void sendGeneralFeedback()}>SEND FEEDBACK</PrimaryButton>
            </div>
          </>
        )}
      </div>

      <div className="mb-9 flex justify-end">
        <button
          onClick={() => void signOut()}
          className="cursor-pointer border border-ink/28 px-3.5 py-2.5 font-mono text-[10.4px] font-medium tracking-[0.16em] text-mute hover:border-red hover:text-red"
        >
          LOG OUT →
        </button>
      </div>

      <div className="mb-4 font-mono text-[10.4px] font-medium tracking-[0.2em] text-faint">SUBMISSION LEDGER</div>
      {history === undefined &&
        Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex flex-wrap items-baseline gap-3.5 border-b border-dotted border-ink/20 py-3.5">
            <Skel className="h-3 w-11" />
            <div className="min-w-0 flex-1 basis-[180px]">
              <Skel className="mb-2 h-[19.5px] w-1/2" />
              <Skel className="h-2.5 w-1/3" />
            </div>
            <Skel className="h-3 w-[200px]" />
          </div>
        ))}
      {history?.length === 0 && (
        <EmptyState
          bordered={false}
          title="This ledger is blank so far."
          body="Every accepted screenshot you upload gets logged here — runtime, memory, score, all of it, forever."
          ctaLabel="GO TO TODAY'S STAGE →"
          ctaTo="/today"
        />
      )}
      {history?.slice(0, 30).map(({ submission, question }) => (
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
                style={{ width: `${submission.runtimePercentile}%`, background: submission.runtimePercentile >= 90 ? '#0A7A52' : submission.runtimePercentile >= 70 ? '#14161A' : '#C8362B' }}
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

function Legend({ color, label, border = false }: { color: string; label: string; border?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-3.5 w-3.5" style={{ background: color, border: border ? '1px solid rgba(20,22,26,.3)' : 'none' }} />
      <div className="font-mono text-[10px] font-medium tracking-[0.12em] text-mute">{label}</div>
    </div>
  )
}
