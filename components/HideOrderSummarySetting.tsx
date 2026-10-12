import type { ReactElement } from 'react'
import { ToggleSwitch } from './ToggleSwitch'
import {
  hiddenOrderActionIds,
  ORDER_SUMMARY_ACTIONS,
  parseOrderSummaryMode,
  toggleOrderSummaryAction,
  withOrderSummaryMode,
  type HideOrderSummary,
} from '../lib/order-summary'

interface HideOrderSummarySettingProps {
  preference: HideOrderSummary
  onChange: (preference: HideOrderSummary) => void
}

export function HideOrderSummarySetting({
  preference,
  onChange,
}: HideOrderSummarySettingProps): ReactElement {
  const hidden = hiddenOrderActionIds(preference)
  return (
    <div className="mt-6 border-t border-zinc-200 pt-4">
      <label className="block text-sm font-semibold text-zinc-900" htmlFor="hide-order-summary">
        Order summary
      </label>
      <p className="mt-0.5 text-sm leading-5 text-zinc-600">
        Add more items, a promo code or gift card, removing the subsidy, and the info icons beside
        each breakdown row. Cancel stays.
      </p>
      <div className="relative mt-3">
        <select
          id="hide-order-summary"
          value={preference.mode}
          onChange={event => {
            const mode = parseOrderSummaryMode(event.target.value)
            if (mode === null) return
            onChange(withOrderSummaryMode(preference, mode))
          }}
          className="w-full cursor-pointer appearance-none rounded-xl bg-white py-2 pr-10 pl-3 text-sm font-semibold text-zinc-900 ring-1 ring-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#009900]"
        >
          <option value="hide-all">Hide all</option>
          <option value="show-all">Show all</option>
          <option value="custom">Custom...</option>
        </select>
        <svg
          viewBox="0 0 16 16"
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 fill-none stroke-zinc-500 stroke-2"
        >
          <path d="M4 6.5 8 10.5 12 6.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {preference.mode === 'custom' ? (
        <div className="mt-3 flex flex-col gap-2">
          {ORDER_SUMMARY_ACTIONS.map(action => (
            <ActionSwitch
              key={action.id}
              label={action.label}
              hidden={hidden.has(action.id)}
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

function ActionSwitch({
  label,
  hidden,
  onToggle,
}: {
  label: string
  hidden: boolean
  onToggle: () => void
}): ReactElement {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={hidden}
      aria-label={`Hide ${label}`}
      onClick={onToggle}
      className="flex w-full items-center gap-3 rounded-xl bg-white px-3 py-2 text-left ring-1 ring-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#009900]"
    >
      <ToggleSwitch on={hidden} />
      <span className="text-sm font-semibold text-zinc-900">{label}</span>
    </button>
  )
}
