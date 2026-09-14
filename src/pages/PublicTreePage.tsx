import { Link } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Skel } from '../components/Skeleton'
import { stripMarkdown } from '../lib/stripMarkdown'

export default function PublicTreePage() {
  const weeks = useQuery(api.syllabus.listWeeks)

  return (
    <div className="animate-fade min-h-screen bg-graph">
      <div className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-ink/14 bg-ground/92 px-4 py-3.5 backdrop-blur md:px-10">
        <Link to="/" className="cursor-pointer font-mono text-[11.5px] font-medium tracking-[0.2em] no-underline">
          ← DSA&nbsp;JOURNEY
        </Link>
        <Link to="/auth" className="cursor-pointer bg-ink px-3.5 py-2.5 font-mono text-[11px] font-medium tracking-[0.16em] text-ground no-underline hover:bg-red">
          ENTER →
        </Link>
      </div>

      <div className="flex flex-wrap items-end gap-6 border-b border-ink/14 px-4 py-9 md:gap-13.5 md:px-10 md:py-16">
        <div className="min-w-0 flex-1 basis-[340px]">
          <div className="mb-5.5 font-mono text-[10.4px] font-medium tracking-[0.2em] text-mute">
            PUBLIC SYLLABUS · NO ACCOUNT NEEDED
          </div>
          <div className="font-serif text-[40px] leading-[0.93] tracking-[-0.02em] md:text-[84px]">The season tree</div>
        </div>
        <div className="min-w-0 flex-1 basis-[300px] font-sans text-[16px] leading-[1.7] text-mute md:text-[19px]">
          {weeks?.length ?? 17} levels, seven stages each, branching off one trunk in the order you should actually
          learn them. Everything below is the full curriculum — read it before you take a handle.
        </div>
      </div>

      <div className="px-4 py-8 md:px-10 md:py-13">
        <div className="mb-1.5 flex justify-center">
          <div className="border border-ink/20 bg-paper px-3 py-1.5 font-mono text-[10.4px] font-medium tracking-[0.2em] text-faint">
            ROOT · WEEK 01
          </div>
        </div>

        {weeks === undefined && (
          <div className="mx-auto flex max-w-[440px] flex-col gap-6 py-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="border border-ink/18 border-t-2 border-t-ink/14 px-5 py-4.5" style={{ marginLeft: i % 2 === 1 ? 'auto' : 0 }}>
                <Skel className="mb-2.5 h-2.5 w-24" />
                <Skel className="mb-2 h-[22px] w-3/4 md:h-[27px]" />
                <Skel className="mb-1.5 h-2.5 w-full" />
                <Skel className="h-2.5 w-2/3" />
              </div>
            ))}
          </div>
        )}
        {(weeks ?? []).map((w, i) => {
          const right = i % 2 === 1
          return (
            <div key={w._id} className="grid grid-cols-[minmax(0,1fr)_clamp(40px,5vw,72px)_minmax(0,1fr)]">
              <div className="relative col-start-2 row-start-1 flex items-center justify-center">
                <div className="absolute inset-y-0 left-1/2 w-[3px] -ml-[1.5px] bg-ink/18" />
                <div
                  className="absolute top-1/2 h-[3px] -mt-[1.5px] bg-ink/18"
                  style={{ left: right ? '50%' : '0', right: right ? '0' : '50%' }}
                />
                <div className="relative h-[15px] w-[15px] rounded-full border-2 border-ink/28 bg-ground" />
              </div>
              <div
                className="row-start-1 flex items-center py-2.5"
                style={{ gridColumn: right ? 3 : 1, justifyContent: right ? 'flex-start' : 'flex-end' }}
              >
                <div
                  className="w-full max-w-[440px] border border-ink/18 border-t-2 border-t-ink/14 bg-transparent px-5 py-4.5"
                  style={{ textAlign: right ? 'left' : 'right' }}
                >
                  <div className="mb-2.5 flex items-center gap-2.5" style={{ justifyContent: right ? 'flex-start' : 'flex-end' }}>
                    <div className="font-mono text-[10.4px] font-medium tracking-[0.16em] text-faint">
                      LEVEL {String(w.weekNumber).padStart(2, '0')}
                    </div>
                    <div className="w-3.5 border-b border-dotted border-ink/30" />
                    <div className="font-mono text-[10.4px] font-medium tracking-[0.14em] text-mute">7 STAGES</div>
                  </div>
                  <div className="mb-2 font-serif text-[22px] leading-[1.12] md:text-[27px]">{w.topic}</div>
                  <div className="font-sans text-[15px] leading-[1.62] text-mute">{stripMarkdown(w.explanation).slice(0, 140)}…</div>
                </div>
              </div>
            </div>
          )
        })}

        <div className="mt-1.5 flex justify-center">
          <div className="border border-ink/20 bg-paper px-3 py-1.5 font-mono text-[10.4px] font-medium tracking-[0.2em] text-faint">
            LEAF · WEEK {weeks?.length ?? 17}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-5.5 border-t border-ink/14 px-4 py-10 md:px-10 md:py-13.5">
        <div className="font-serif text-[26px] leading-[1.05] md:text-[44px]">
          Well over a hundred stages, in this order.
          <br />
          <em className="italic text-red">Start at the root.</em>
        </div>
        <Link to="/auth" className="cursor-pointer bg-ink px-5 py-3.5 font-mono text-[11.5px] font-medium tracking-[0.18em] text-ground no-underline hover:bg-red">
          TAKE A HANDLE →
        </Link>
      </div>
    </div>
  )
}
