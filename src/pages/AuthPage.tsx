import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Authenticated, Unauthenticated, AuthLoading } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'

const SEASON_GRID = Array.from({ length: 119 }, (_, i) => i)

function AuthForm() {
  const { signIn } = useAuthActions()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setError(null)
    if (!/^[a-z0-9_]{3,20}$/.test(username.trim().toLowerCase())) {
      setError('Handle must be 3-20 lowercase letters, numbers, or underscores.')
      return
    }
    if (password.length < 8) {
      setError('Passphrase needs at least 8 characters.')
      return
    }
    setBusy(true)
    try {
      await signIn('password', { username: username.trim().toLowerCase(), password, flow: mode === 'login' ? 'signIn' : 'signUp' })
      navigate('/today')
    } catch {
      setError(mode === 'login' ? 'Invalid handle or passphrase.' : 'That handle is already taken.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-graph animate-fade">
      <div className="hidden flex-col justify-center gap-8.5 border-r border-ink/14 p-7 md:flex md:p-15">
        <div className="font-mono text-[11.5px] font-medium tracking-[0.2em] text-mute">DSA JOURNEY&nbsp;&nbsp;/&nbsp;&nbsp;SEASON 01</div>
        <div className="font-serif text-[44px] leading-[0.92] tracking-[-0.015em] md:text-[72px]">
          Eighty-plus problems,
          <br />
          in order,
          <br />
          <em className="italic text-red">on the record.</em>
        </div>
        <div className="max-w-[40ch] font-sans text-[17.3px] leading-[1.65] text-mute">
          Seventeen levels. Seven stages each. Your percentiles are read off the submission screenshot, so the board
          can't be talked up.
        </div>
        <div>
          <div className="mb-3 font-mono text-[10.4px] font-medium tracking-[0.18em] text-mute">
            SEASON GRID · {SEASON_GRID.length} STAGES
          </div>
          <div className="flex max-w-[420px] flex-wrap gap-[3px]">
            {SEASON_GRID.map((i) => (
              <div key={i} className="h-[13px] w-[13px] border border-ink/20" />
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-7 md:p-15">
        <div className="w-full max-w-[376px]">
          <div className="mb-8.5 font-mono text-[11.5px] font-medium tracking-[0.2em] text-mute md:hidden">
            DSA JOURNEY&nbsp;&nbsp;/&nbsp;&nbsp;SEASON 01
          </div>
          <div className="mb-8.5 flex gap-5.5">
            <button
              onClick={() => setMode('login')}
              className="cursor-pointer border-b-2 pb-2 font-mono text-[11.5px] font-medium tracking-[0.16em]"
              style={{ borderBottomColor: mode === 'login' ? '#C8362B' : 'transparent', color: mode === 'login' ? '#14161A' : '#9A9CA1' }}
            >
              LOG IN
            </button>
            <button
              onClick={() => setMode('signup')}
              className="cursor-pointer border-b-2 pb-2 font-mono text-[11.5px] font-medium tracking-[0.16em]"
              style={{ borderBottomColor: mode === 'signup' ? '#C8362B' : 'transparent', color: mode === 'signup' ? '#14161A' : '#9A9CA1' }}
            >
              SIGN UP
            </button>
          </div>

          <div className="mb-2.5 font-mono text-[10.4px] font-medium tracking-[0.18em] text-mute">HANDLE</div>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="arjun_dev"
            className="mb-7.5 w-full border-0 border-b border-ink/30 bg-transparent px-0.5 py-2.5 font-mono text-[19.5px] font-medium leading-[1.2] text-ink outline-none focus:border-red"
          />
          <div className="mb-2.5 font-mono text-[10.4px] font-medium tracking-[0.18em] text-mute">PASSPHRASE</div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="············"
            onKeyDown={(e) => e.key === 'Enter' && void submit()}
            className="mb-9.5 w-full border-0 border-b border-ink/30 bg-transparent px-0.5 py-2.5 font-mono text-[19.5px] font-medium leading-[1.2] text-ink outline-none focus:border-red"
          />

          {error && <div className="mb-4 font-sans text-[14px] text-red">{error}</div>}

          <button
            onClick={() => void submit()}
            disabled={busy}
            className="flex w-full cursor-pointer items-center justify-between gap-3.5 bg-ink px-4.5 py-4 text-ground transition-colors hover:bg-red disabled:opacity-50"
          >
            <div className="font-mono text-[12.6px] font-medium tracking-[0.18em]">
              {busy ? 'WORKING…' : mode === 'login' ? 'LOG IN' : 'CREATE HANDLE'}
            </div>
            <div className="font-mono text-[15px]">→</div>
          </button>

          <div className="mt-5.5 font-sans text-[15px] text-mute">
            Spectating is free —{' '}
            <a href="/tree" className="cursor-pointer text-red">
              open the board
            </a>{' '}
            without an account.
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <>
      <AuthLoading>
        <div className="min-h-screen bg-graph" />
      </AuthLoading>
      <Unauthenticated>
        <AuthForm />
      </Unauthenticated>
      <Authenticated>
        <Navigate to="/today" replace />
      </Authenticated>
    </>
  )
}
