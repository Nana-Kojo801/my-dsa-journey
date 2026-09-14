import { useEffect, useRef, useState } from 'react'

export function useCountUp(target: number | undefined, durationMs = 700): number {
  const [display, setDisplay] = useState(target ?? 0)
  const prevRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (target === undefined) return
    const from = prevRef.current ?? target
    prevRef.current = target
    if (from === target) {
      setDisplay(target)
      return
    }
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(from + (target - from) * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs])

  return display
}
