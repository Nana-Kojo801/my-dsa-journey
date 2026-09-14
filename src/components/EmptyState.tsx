import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function SlotRows({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-3.5 border-b border-dashed border-ink/18 py-3.5 pr-2.5">
          <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center border border-dashed border-ink/24 font-mono text-[13px] text-faint">
            {String(i + 1).padStart(2, '0')}
          </div>
          <div className="min-w-0 flex-1 font-serif text-[17px] italic text-faint">Open slot</div>
          <div className="font-mono text-[19px] text-faint">—</div>
        </div>
      ))}
    </>
  )
}

export function EmptyState({
  title,
  body,
  ctaLabel,
  ctaTo,
  onCta,
  bordered = true,
  children,
}: {
  title: ReactNode
  body?: string
  ctaLabel?: string
  ctaTo?: string
  onCta?: () => void
  bordered?: boolean
  children?: ReactNode
}) {
  return (
    <div className={bordered ? 'border-t border-ink/30' : ''}>
      {children}
      <div className="py-6 text-center">
        <div className="mx-auto mb-3 font-serif text-[22px] leading-[1.25]">{title}</div>
        {body && <div className="mx-auto mb-4.5 max-w-[46ch] font-sans text-[14.5px] leading-[1.6] text-mute">{body}</div>}
        {ctaLabel && (ctaTo || onCta) && (
          <div className="flex justify-center">
            {ctaTo ? (
              <Link
                to={ctaTo}
                className="inline-flex cursor-pointer items-center gap-2.5 bg-ink px-4 py-3 font-mono text-[10.9px] font-medium tracking-[0.18em] text-ground no-underline hover:bg-red"
              >
                {ctaLabel}
              </Link>
            ) : (
              <button
                onClick={onCta}
                className="inline-flex cursor-pointer items-center gap-2.5 bg-ink px-4 py-3 font-mono text-[10.9px] font-medium tracking-[0.18em] text-ground hover:bg-red"
              >
                {ctaLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
