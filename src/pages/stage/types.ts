export type Extracted = {
  runtimePercentile: number
  memoryPercentile: number
  runtimeValue: string
  memoryValue: string
}

export type Best = { runtimePercentile: number; memoryPercentile: number } | null

export const FB_FIELDS = ['RUNTIME %', 'MEMORY %', 'RUNTIME VALUE', 'MEMORY VALUE', 'ALL OF IT'] as const
export type FeedbackField = (typeof FB_FIELDS)[number]
