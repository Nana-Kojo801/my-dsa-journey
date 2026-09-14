export const COMPLETION_POINTS = 100;
export const MAX_PERCENTILE_BONUS = 100;

export function computeScore(runtimePercentile: number, memoryPercentile: number): number {
  const avg = (runtimePercentile + memoryPercentile) / 2;
  const bonus = Math.round((avg / 100) * MAX_PERCENTILE_BONUS);
  return COMPLETION_POINTS + bonus;
}
