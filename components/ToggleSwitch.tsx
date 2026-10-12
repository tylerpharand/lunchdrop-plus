import type { ReactElement } from 'react'

export function ToggleSwitch({ on }: { on: boolean }): ReactElement {
  return (
    <span
      className={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ease-out motion-reduce:transition-none ${
        on ? 'bg-[#009900]' : 'bg-zinc-300'
      }`}
      aria-hidden="true"
    >
      <span
        className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out motion-reduce:transition-none ${
          on ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </span>
  )
}
