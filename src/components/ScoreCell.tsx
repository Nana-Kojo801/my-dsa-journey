import type { CSSProperties } from 'react'
import { useCountUp } from '../lib/useCountUp'

export function ScoreCell({
  value,
  className = '',
  style,
}: {
  value: number
  className?: string
  style?: CSSProperties
}) {
  const display = useCountUp(value)
  return (
    <span className={className} style={style}>
      {display.toLocaleString()}
    </span>
  )
}
