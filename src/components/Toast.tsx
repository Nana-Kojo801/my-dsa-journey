import { useCallback, useRef, useState, type ReactNode } from 'react'
import { ToastContext } from '../lib/toastContext'

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flash = useCallback((m: string) => {
    setMsg(m)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setMsg(null), 2200)
  }, [])

  return (
    <ToastContext.Provider value={flash}>
      {children}
      {msg !== null && (
        <div className="animate-fade fixed left-1/2 bottom-6 z-[120] -translate-x-1/2 whitespace-nowrap bg-ink px-4.5 py-3 font-mono text-[10.4px] font-medium tracking-[0.16em] text-ground">
          {msg}
        </div>
      )}
    </ToastContext.Provider>
  )
}
