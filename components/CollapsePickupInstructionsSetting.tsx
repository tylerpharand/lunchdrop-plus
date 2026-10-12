import type { ReactElement } from 'react'
import { SettingSwitch } from './SettingSwitch'

interface CollapsePickupInstructionsSettingProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
  nested?: boolean
}

export function CollapsePickupInstructionsSetting({
  enabled,
  onChange,
  nested = false,
}: CollapsePickupInstructionsSettingProps): ReactElement {
  return (
    <div className={nested ? '' : 'mt-6 border-t border-zinc-200 pt-4'}>
      <SettingSwitch
        label="Collapse pickup instructions"
        checked={enabled}
        onToggle={() => {
          onChange(!enabled)
        }}
      />
      <p className="mt-2 text-sm leading-5 text-zinc-600">
        Pickup instructions and the address under them start collapsed. A right-facing chamfer sits
        beside the label, and tapping the label or the chamfer opens them.
      </p>
    </div>
  )
}
