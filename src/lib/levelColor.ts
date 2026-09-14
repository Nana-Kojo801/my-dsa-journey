export const LEVEL_PALETTE = ['#C8362B', '#1D4ED8', '#0A7A52', '#C98A0B', '#6D28D9', '#0F8B8D'] as const

export function levelColor(weekNumber: number): string {
  return LEVEL_PALETTE[(weekNumber - 1) % LEVEL_PALETTE.length]
}
