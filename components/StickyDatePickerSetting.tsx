import type { ReactElement } from 'react'
import { SettingSwitch } from './SettingSwitch'

interface StickyDatePickerSettingProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
}

export function StickyDatePickerSetting({
  enabled,
  onChange,
}: StickyDatePickerSettingProps): ReactElement {
  return (
    <div className="mt-6 border-t border-zinc-200 pt-4">
      <SettingSwitch
        label="Improved menu bar"
        checked={enabled}
        onToggle={() => {
          onChange(!enabled)
        }}
      />
      <p className="mt-2 text-sm leading-5 text-zinc-600">
        The date picker stays at the top in place of the header. Days fade at the edges between a
        white logo on the left and the menu button on the right. The calendar button stays off.
      </p>
    </div>
  )
}
