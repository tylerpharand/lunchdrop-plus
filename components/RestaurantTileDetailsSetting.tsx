import type { ReactElement } from 'react'
import { ToggleSwitch } from './ToggleSwitch'

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
        <span className="text-sm font-semibold text-zinc-900">Enhanced restaurant tiles</span>
      </button>
      <p className="mt-2 text-sm leading-5 text-zinc-600">
        Delivery times and deadlines stay off the tile. A placed order turns the tile dark green and
        adds Order Placed under the logo.
      </p>
    </div>
  )
}
