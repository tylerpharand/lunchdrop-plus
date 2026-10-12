import type { ReactElement } from 'react'
import { SettingSwitch } from './SettingSwitch'

interface WrapDescriptionsSettingProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
}

export function WrapDescriptionsSetting({
  enabled,
  onChange,
}: WrapDescriptionsSettingProps): ReactElement {
  return (
    <div className="mt-6 border-t border-zinc-200 pt-4">
      <SettingSwitch
        label="Wrap long descriptions"
        checked={enabled}
        onToggle={() => {
          onChange(!enabled)
        }}
      />
      <p className="mt-2 text-sm leading-5 text-zinc-600">
        A long word in an item description wraps onto the next line.
      </p>
    </div>
  )
}
