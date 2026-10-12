import type { ReactElement } from 'react'
import { SettingSwitch } from './SettingSwitch'

interface RestaurantTileDetailsSettingProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
}

export function RestaurantTileDetailsSetting({
  enabled,
  onChange,
}: RestaurantTileDetailsSettingProps): ReactElement {
  return (
    <div className="mt-6 border-t border-zinc-200 pt-4">
      <SettingSwitch
        label="Enhanced restaurant tiles"
        checked={enabled}
        onToggle={() => {
          onChange(!enabled)
        }}
      />
      <p className="mt-2 text-sm leading-5 text-zinc-600">
        Delivery times and deadlines stay off the tile. A placed order turns the tile dark green and
        adds Order Placed under the logo.
      </p>
    </div>
  )
}
