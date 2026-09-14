import { MonoLabel, PrimaryButton } from '../../components/ui'

export function ScreenshotHelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div onClick={onClose} className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/42 p-4.5">
      <div onClick={(e) => e.stopPropagation()} className="animate-fade w-full max-w-[480px] border border-ink/30 bg-ground p-6 shadow-[0_18px_50px_rgba(20,22,26,.22)]">
        <MonoLabel className="mb-4">HOW TO TAKE THE SCREENSHOT</MonoLabel>
        <div className="mb-5 font-serif text-[26px] leading-[1.15]">Getting a clean read.</div>
        <ol className="mb-6 flex flex-col gap-3.5 font-sans text-[15.5px] leading-[1.6] text-[#2C2F35]">
          <li className="flex gap-3">
            <span className="font-mono text-[13px] text-faint">01</span>
            <span>Submit your solution on LeetCode and wait for the "Accepted" result panel.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-[13px] text-faint">02</span>
            <span>
              Screenshot the panel so both the <strong>Runtime</strong> block and the <strong>Memory</strong> block are
              visible, each showing its "Beats X%" line.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-[13px] text-faint">03</span>
            <span>Crop out anything else — the reader only needs those two blocks, not the code or console.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-[13px] text-faint">04</span>
            <span>
              Upload the PNG or JPG here, or just copy it and press <strong>Ctrl+V</strong> (<strong>⌘V</strong> on Mac)
              anywhere on this page.
            </span>
          </li>
        </ol>
        <PrimaryButton onClick={onClose} className="w-full text-center">
          GOT IT
        </PrimaryButton>
      </div>
    </div>
  )
}
