import type { ReactNode } from 'react'

const INLINE_RE = /(\*\*.+?\*\*|\*.+?\*|`.+?`)/g

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(INLINE_RE)
  return parts
    .filter((p) => p.length > 0)
    .map((part, i) => {
      const key = `${keyPrefix}-${i}`
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={key} className="font-semibold text-ink">
            {part.slice(2, -2)}
          </strong>
        )
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={key} className="bg-ink/6 px-1 py-px font-mono text-[0.88em] text-ink">
            {part.slice(1, -1)}
          </code>
        )
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={key} className="italic text-red">
            {part.slice(1, -1)}
          </em>
        )
      }
      return part
    })
}

type Block = { type: 'p'; text: string } | { type: 'ul'; items: string[] }

function parseBlocks(content: string): Block[] {
  const chunks = content.trim().split(/\n\s*\n/)
  return chunks.map((chunk) => {
    const lines = chunk
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
    if (lines.length > 0 && lines.every((l) => l.startsWith('- '))) {
      return { type: 'ul', items: lines.map((l) => l.slice(2)) }
    }
    return { type: 'p', text: lines.join(' ') }
  })
}

export function Prose({ content, className = '' }: { content: string; className?: string }) {
  const blocks = parseBlocks(content)
  return (
    <div className={className}>
      {blocks.map((block, i) => {
        if (block.type === 'ul') {
          return (
            <ul key={i} className="mb-6 flex flex-col gap-3">
              {block.items.map((item, j) => (
                <li key={j} className="flex items-start gap-3">
                  <div className="mt-[0.65em] h-1.5 w-1.5 shrink-0 bg-red" />
                  <div>{renderInline(item, `${i}-${j}`)}</div>
                </li>
              ))}
            </ul>
          )
        }
        return (
          <p key={i} className="mb-5 last:mb-0">
            {renderInline(block.text, String(i))}
          </p>
        )
      })}
    </div>
  )
}
