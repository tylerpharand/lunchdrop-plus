import type { ReactElement } from 'react'
import { SettingSwitch } from './SettingSwitch'

interface HideTooltipsSettingProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
}

export function HideTooltipsSetting({ enabled, onChange }: HideTooltipsSettingProps): ReactElement {
  return (
    <div className="mt-6 border-t border-zinc-200 pt-4">
      <SettingSwitch
        label="Hide tooltips"
        checked={enabled}
        onToggle={() => {
          onChange(!enabled)
        }}
      />
      <p className="mt-2 text-sm leading-5 text-zinc-600">
        Hovering or tapping a line such as the daily discount no longer opens a tooltip.
      </p>
    </div>
  )
}
