import type { CSSProperties } from 'react'

export function Skel({
  className = '',
  dark = false,
  style,
}: {
  className?: string
  dark?: boolean
  style?: CSSProperties
}) {
  return <div className={`${dark ? 'skeleton-dark' : 'skeleton'} ${className}`} style={style} />
}

export function SkelLines({
  count = 3,
  lastWidth = 'w-2/3',
  dark = false,
  className = '',
}: {
  count?: number
  lastWidth?: string
  dark?: boolean
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <Skel key={i} dark={dark} className={`h-[0.95em] ${i === count - 1 ? lastWidth : 'w-full'}`} />
      ))}
    </div>
  )
}

export function SkelRow({ dark = false, className = '' }: { dark?: boolean; className?: string }) {
  return (
    <div className={`flex items-center gap-3.5 py-3.5 ${className}`}>
      <Skel dark={dark} className="h-8 w-8 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skel dark={dark} className="h-3.5 w-1/2" />
        <Skel dark={dark} className="h-2.5 w-1/3" />
      </div>
      <Skel dark={dark} className="h-4 w-12 shrink-0" />
    </div>
  )
}

export function SkelStepper({ count = 7 }: { count?: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center">
          {i > 0 && <div className="h-px w-3 bg-ink/10 md:w-5" />}
          <Skel className="h-8 w-8 shrink-0 rounded-full" />
        </div>
      ))}
    </div>
  )
}
