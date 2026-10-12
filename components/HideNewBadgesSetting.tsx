import type { ReactElement } from 'react'
import { SettingSwitch } from './SettingSwitch'

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
      <SettingSwitch
        label="Hide New badges"
        checked={enabled}
        onToggle={() => {
          onChange(!enabled)
        }}
      />
      <p className="mt-2 text-sm leading-5 text-zinc-600">
        The green New badge on a restaurant tile.
      </p>
    </div>
  )
}
