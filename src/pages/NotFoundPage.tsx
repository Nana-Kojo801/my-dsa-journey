import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="animate-fade flex min-h-screen flex-col bg-graph">
      <div className="flex items-center justify-between gap-4 border-b border-ink/14 px-4 py-3.5 md:px-10">
        <Link to="/" className="cursor-pointer font-mono text-[11.5px] font-medium tracking-[0.2em] text-ink no-underline">
          DSA&nbsp;JOURNEY
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mb-5 font-mono text-[10.4px] font-medium tracking-[0.2em] text-red">STAGE 404 · NOT CLEARED</div>
        <div className="mb-5 font-serif text-[64px] leading-[0.9] tracking-[-0.02em] md:text-[104px]">
          Dead <em className="italic text-red">end.</em>
        </div>
        <div className="mb-8 max-w-[46ch] font-sans text-[16.7px] leading-[1.65] text-mute">
          Nothing's charted at this path. It may have moved, or you followed a stale link.
        </div>
        <Link
          to="/"
          className="inline-flex cursor-pointer items-center gap-2.5 bg-ink px-5 py-3.5 font-mono text-[11.5px] font-medium tracking-[0.18em] text-ground no-underline hover:bg-red"
        >
          BACK TO START →
        </Link>
      </div>
    </div>
  )
}
