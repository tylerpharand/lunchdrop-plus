import type { ReactElement } from 'react'
import { SettingSwitch } from './SettingSwitch'

interface EvenRestaurantCardsSettingProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
}

export function EvenRestaurantCardsSetting({
  enabled,
  onChange,
}: EvenRestaurantCardsSettingProps): ReactElement {
  return (
    <div className="mt-6 border-t border-zinc-200 pt-4">
      <SettingSwitch
        label="Even restaurant cards"
        checked={enabled}
        onToggle={() => {
          onChange(!enabled)
        }}
      />
      <p className="mt-2 text-sm leading-5 text-zinc-600">
        Cards in a full row grow so the row lines up with the page.
      </p>
    </div>
  )
}
