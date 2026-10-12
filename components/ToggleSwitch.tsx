import type { ReactElement } from 'react'

const TRACK = {
  md: 'h-6 w-11 p-0.5',
  sm: 'h-4 w-7 p-0.5',
} as const

const KNOB = {
  md: 'h-5 w-5',
  sm: 'h-3 w-3',
} as const

const KNOB_ON = {
  md: 'translate-x-5',
  sm: 'translate-x-3',
} as const

export function ToggleSwitch({
  on,
  size = 'md',
}: {
  on: boolean
  size?: 'md' | 'sm'
}): ReactElement {
  return (
    <span
      className={`flex shrink-0 items-center rounded-full transition-colors duration-200 ease-out motion-reduce:transition-none ${TRACK[size]} ${
        on ? 'bg-[#009900]' : 'bg-zinc-300'
      }`}
      aria-hidden="true"
    >
      <span
        className={`rounded-full bg-white shadow-sm transition-transform duration-200 ease-out motion-reduce:transition-none ${KNOB[size]} ${
          on ? KNOB_ON[size] : 'translate-x-0'
        }`}
      />
    </span>
  )
}
