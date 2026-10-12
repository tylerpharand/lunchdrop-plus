import type { ReactElement } from 'react'
import { ToggleSwitch } from './ToggleSwitch'

interface HideNewBadgesSettingProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
}

export function HideNewBadgesSetting({
  enabled,
  onChange,
}: HideNewBadgesSettingProps): ReactElement {
  return (
    <div className="mt-6 border-t border-zinc-200 pt-4">
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => {
          onChange(!enabled)
        }}
        className="flex w-full items-center gap-3 rounded-xl bg-white px-3 py-2 text-left ring-1 ring-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#009900]"
      >
        <ToggleSwitch on={enabled} />
        <span className="text-sm font-semibold text-zinc-900">Hide New badges</span>
      </button>
      <p className="mt-2 text-sm leading-5 text-zinc-600">
        The green New badge on a restaurant tile.
      </p>
    </div>
  )
}
