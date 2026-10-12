import { useEffect, useRef, type ReactElement } from 'react'
import { useSwitchMotion } from './motion'

export function CustomAmountEditor({
  revealed,
  amount,
  focusToken,
  onAmount,
  onCommit,
}: {
  revealed: boolean
  amount: string
  focusToken: number
  onAmount: (value: string) => void
  onCommit: () => void
}): ReactElement {
  const inputRef = useRef<HTMLInputElement>(null)
  const animate = useSwitchMotion(revealed)
  useEffect(() => {
    if (!revealed || focusToken === 0) return
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [focusToken, revealed])

  return (
    <div className="pt-3">
      <label
        className={`flex items-center gap-1 rounded-xl bg-white px-3 py-2 ring-1 ring-zinc-200 focus-within:ring-[#009900] ${
          animate && revealed ? 'lunchbot-chip-in' : ''
        } ${animate && !revealed ? 'lunchbot-chip-out' : ''} ${!animate && !revealed ? 'opacity-0' : ''}`}
      >
        <span className="text-sm font-semibold text-zinc-500" aria-hidden="true">
          $
        </span>
        <input
          ref={inputRef}
          value={amount}
          inputMode="decimal"
          autoComplete="off"
          aria-label="Custom support amount"
          onChange={event => {
            onAmount(event.target.value)
          }}
          onBlur={onCommit}
          onKeyDown={event => {
            if (event.key !== 'Enter') return
            event.currentTarget.blur()
          }}
          className="w-full bg-transparent text-sm font-semibold text-zinc-900 tabular-nums outline-none"
        />
      </label>
    </div>
  )
}
