import { Link } from 'react-router-dom'

export default function ErrorPage({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="animate-fade flex min-h-screen flex-col bg-graph">
      <div className="flex items-center justify-between gap-4 border-b border-ink/14 px-4 py-3.5 md:px-10">
        <Link to="/" className="cursor-pointer font-mono text-[11.5px] font-medium tracking-[0.2em] text-ink no-underline">
          DSA&nbsp;JOURNEY
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mb-5 font-mono text-[10.4px] font-medium tracking-[0.2em] text-red">RUNTIME ERROR · UNCAUGHT</div>
        <div className="mb-5 font-serif text-[64px] leading-[0.9] tracking-[-0.02em] md:text-[104px]">
          Something <em className="italic text-red">broke.</em>
        </div>
        <div className="mb-8 max-w-[46ch] font-sans text-[16.7px] leading-[1.65] text-mute">
          The page hit a snag on its end. Nothing you did caused this — try again, or head back and pick up where you left
          off.
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onRetry ?? (() => window.location.reload())}
            className="inline-flex cursor-pointer items-center gap-2.5 bg-ink px-5 py-3.5 font-mono text-[11.5px] font-medium tracking-[0.18em] text-ground hover:bg-red"
          >
            RELOAD
          </button>
          <Link
            to="/"
            className="cursor-pointer border-b border-red/35 pb-0.5 font-mono text-[11px] font-medium tracking-[0.16em] text-red no-underline"
          >
            BACK TO START →
          </Link>
        </div>
      </div>
    </div>
  )
}
