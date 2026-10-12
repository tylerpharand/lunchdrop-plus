import type { ReactElement, ReactNode } from 'react'
import { SettingSwitch } from './SettingSwitch'

interface SimplifiedOrderSummarySettingProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
  children: ReactNode
}

export function SimplifiedOrderSummarySetting({
  enabled,
  onChange,
  children,
}: SimplifiedOrderSummarySettingProps): ReactElement {
  return (
    <div className="mt-6 border-t border-zinc-200 pt-4">
      <SettingSwitch
        label="Simplified order summary"
        checked={enabled}
        onToggle={() => {
          onChange(!enabled)
        }}
      />
      <p className="mt-2 text-sm leading-5 text-zinc-600">
        Cancel this order sits at the bottom left. Include utensils sits on the same row, at the
        bottom right.
      </p>
      {enabled ? (
        <div className="mt-4 flex flex-col gap-4 border-l border-zinc-200 pl-3">{children}</div>
      ) : null}
    </div>
  )
}
