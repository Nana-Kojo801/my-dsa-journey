export function stripMarkdown(content: string): string {
  return content
    .replace(/\n{2,}/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^- /gm, '')
    .trim()
}
