import { Component, type ReactNode } from 'react'
import ErrorPage from '../pages/ErrorPage'

const RECOVERY_KEY = 'dsa-auto-recovered'

function hasRecovered(): boolean {
  try {
    return sessionStorage.getItem(RECOVERY_KEY) === '1'
  } catch {
    return true
  }
}

function markRecovered() {
  try {
    sessionStorage.setItem(RECOVERY_KEY, '1')
  } catch {
    // ignore — private mode / storage unavailable
  }
}

function clearRecovered() {
  try {
    sessionStorage.removeItem(RECOVERY_KEY)
  } catch {
    // ignore
  }
}

type Props = { children: ReactNode }
type State = { hasError: boolean }

// Mobile/PWA sessions can resume with a stale Convex connection or expired
// session after being backgrounded, which throws once during the first
// re-render. Rather than show a scary error screen for a problem a reload
// fixes, auto-reload silently the first time this session hits an error; if
// it keeps happening, fall back to the visible error page with a manual retry.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }
  private clearTimer: ReturnType<typeof setTimeout> | undefined

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error('Uncaught render error', error, info)
    if (!hasRecovered()) {
      markRecovered()
      window.location.reload()
    }
  }

  componentDidMount() {
    // The app rendered fine — give this session a fresh "one free auto-reload"
    // for the next crash, instead of only ever once per tab lifetime.
    this.clearTimer = setTimeout(clearRecovered, 5000)
  }

  componentWillUnmount() {
    if (this.clearTimer) clearTimeout(this.clearTimer)
  }

  render() {
    if (this.state.hasError) {
      if (!hasRecovered()) return null
      return <ErrorPage onRetry={() => { clearRecovered(); this.setState({ hasError: false }) }} />
    }
    return this.props.children
  }
}
