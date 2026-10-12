import type { ReactElement } from 'react'
import {
  hiddenOrderActionIds,
  ORDER_SUMMARY_ACTIONS,
  parseOrderSummaryMode,
  toggleOrderSummaryAction,
  withOrderSummaryMode,
  type HideOrderSummary,
} from '../lib/order-summary'
import { ModeSelect } from './ModeSelect'
import { SettingSwitch } from './SettingSwitch'

interface HideOrderSummarySettingProps {
  preference: HideOrderSummary
  onChange: (preference: HideOrderSummary) => void
  nested?: boolean
}

export function HideOrderSummarySetting({
  preference,
  onChange,
  nested = false,
}: HideOrderSummarySettingProps): ReactElement {
  const hidden = hiddenOrderActionIds(preference)
  return (
    <div className={nested ? '' : 'mt-6 border-t border-zinc-200 pt-4'}>
      <label className="block text-sm font-semibold text-zinc-900" htmlFor="hide-order-summary">
        {nested ? 'Footer options' : 'Order summary'}
      </label>
      <p className="mt-0.5 text-sm leading-5 text-zinc-600">
        Add more items, a promo code or gift card, removing the subsidy, and the info icons beside
        each breakdown row.
      </p>
      <ModeSelect
        id="hide-order-summary"
        value={preference.mode}
        onChange={value => {
          const mode = parseOrderSummaryMode(value)
          if (mode === null) return
          onChange(withOrderSummaryMode(preference, mode))
        }}
      />
      {preference.mode === 'custom' ? (
        <div className="mt-3 flex flex-col gap-2">
          {ORDER_SUMMARY_ACTIONS.map(action => (
            <SettingSwitch
              key={action.id}
              label={action.label}
              checked={hidden.has(action.id)}
              ariaLabel={`Hide ${action.label}`}
              onToggle={() => {
                onChange(toggleOrderSummaryAction(preference, action.id))
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
