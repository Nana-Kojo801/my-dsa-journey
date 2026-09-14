import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { todayLocalStr } from '../lib/date'
import { EmptyState } from '../components/EmptyState'
import StagePage from './StagePage'

export default function TodayPage() {
  const ctx = useQuery(api.syllabus.getTodayContext, { today: todayLocalStr() })

  if (ctx !== undefined && ctx.question === null) {
    return (
      <div className="mx-auto max-w-[720px] pt-16">
        <EmptyState
          bordered={false}
          title="No stage today."
          body="The season hasn't started yet, or today falls outside it. Check the tree for what's coming."
          ctaLabel="VIEW THE TREE →"
          ctaTo="/weeks"
        />
      </div>
    )
  }

  return <StagePage questionId={ctx?.question?._id} />
}
