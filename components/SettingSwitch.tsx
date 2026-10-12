import type { ReactElement } from 'react'
import { ToggleSwitch } from './ToggleSwitch'

export function SettingSwitch({
  label,
  checked,
  onToggle,
  ariaLabel,
}: {
  label: string
  checked: boolean
  onToggle: () => void
  ariaLabel?: string
}): ReactElement {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      {...(ariaLabel === undefined ? {} : { 'aria-label': ariaLabel })}
      onClick={onToggle}
      className="flex w-full items-center gap-3 rounded-xl bg-white px-3 py-2 text-left ring-1 ring-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#009900]"
    >
      <ToggleSwitch on={checked} />
      <span className="text-sm font-semibold text-zinc-900">{label}</span>
    </button>
  )
}
