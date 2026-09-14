import { useState } from 'react'
import { OverviewTab } from './admin/OverviewTab'
import { SiteFeedbackTab } from './admin/SiteFeedbackTab'
import { ReaderBugsTab } from './admin/ReaderBugsTab'
import { RunnersTab } from './admin/RunnersTab'
import { ExtractionFailuresTab } from './admin/ExtractionFailuresTab'

const TABS = ['Overview', 'Feedback', 'Reader bugs', 'Runners', 'Failed reads'] as const
type Tab = (typeof TABS)[number]

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('Overview')

  return (
    <div className="animate-fade mx-auto max-w-[1080px]">
      <div className="mb-4.5 flex items-center gap-3">
        <div className="font-mono text-[10.4px] font-medium tracking-[0.2em] text-faint">ADMIN · CREATOR ONLY</div>
        <div className="flex-1 border-b border-ink/16" />
      </div>
      <div className="mb-8 font-serif text-[32px] leading-[1] tracking-[-0.015em] md:text-[52px]">Command center</div>

      <div className="mb-8.5 flex flex-wrap gap-5 border-b border-ink/14 pb-4">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="cursor-pointer border-b pb-1.5 font-mono text-[10.4px] font-medium uppercase tracking-[0.14em]"
            style={{ borderBottomColor: tab === t ? '#C8362B' : 'transparent', color: tab === t ? '#14161A' : '#9A9CA1' }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && <OverviewTab />}
      {tab === 'Feedback' && <SiteFeedbackTab />}
      {tab === 'Reader bugs' && <ReaderBugsTab />}
      {tab === 'Runners' && <RunnersTab />}
      {tab === 'Failed reads' && <ExtractionFailuresTab />}
    </div>
  )
}
