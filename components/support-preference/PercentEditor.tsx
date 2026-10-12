import type { ReactElement } from 'react'
import { SUPPORT_PERCENT_CHOICES } from '../../lib/support-policy'
import { releaseMouseFocus, suppressMouseFocus } from './Choice'
import { useSwitchMotion } from './motion'

export function PercentEditor({
  revealed,
  percent,
  onChange,
}: {
  revealed: boolean
  percent: number
  onChange: (percent: number) => void
}): ReactElement {
  const animate = useSwitchMotion(revealed)
  return (
    <div className="grid grid-cols-4 gap-1.5 pt-3">
      {SUPPORT_PERCENT_CHOICES.map(choice => (
        <button
          key={choice}
          type="button"
          aria-pressed={percent === choice}
          tabIndex={-1}
          onMouseDown={suppressMouseFocus}
          onClick={event => {
            onChange(choice)
            releaseMouseFocus(event)
          }}
          className={`lunchbot-control cursor-pointer rounded-full px-2 py-1.5 text-sm font-semibold ${
            animate && revealed ? 'lunchbot-chip-in' : ''
          } ${animate && !revealed ? 'lunchbot-chip-out' : ''} ${
            !animate && !revealed ? 'opacity-0' : ''
          } ${revealed ? '' : 'pointer-events-none'} ${
            percent === choice
              ? 'bg-[#009900] text-white hover:bg-[#007a00] active:bg-[#006600]'
              : 'bg-white text-zinc-700 ring-1 ring-zinc-200 hover:ring-zinc-400 active:ring-zinc-500'
          }`}
        >
          {choice}%
        </button>
      ))}
    </div>
  )
}
