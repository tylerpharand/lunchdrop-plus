import type { ReactElement } from 'react'
import {
  formatDollars,
  parseSupportAmount,
  quotedSupportFee,
  type OrderSupportChoice,
  type SupportChoiceMode,
  type SupportPolicy,
  type SupportQuote,
} from '../lib/support-policy'
import { Choice, ExpandingChoice } from './support-preference/Choice'
import { CustomAmountEditor } from './support-preference/CustomAmountEditor'
import { PercentEditor } from './support-preference/PercentEditor'
import { CHIP_MOTION, CONTROL_FOCUS, STATUS_MOTION } from './support-preference/styles'

export { useSwitchMotion } from './support-preference/motion'

interface SupportStatus {
  pendingMode?: SupportChoiceMode | null
  confirmed?: { mode: SupportChoiceMode; tick: number } | null
}

interface PopupPreferenceProps extends SupportStatus {
  variant?: 'popup'
  policy: SupportPolicy
  quote: SupportQuote | null
  onChange: (policy: SupportPolicy) => void
}

export interface OrderPreferenceProps extends SupportStatus {
  variant: 'order'
  selection: {
    choice: OrderSupportChoice | null
    percent: number
    customAmount: string
  }
  quote: SupportQuote | null
  customFocusToken: number
  onChoice: (choice: OrderSupportChoice) => void
  onPercent: (percent: number) => void
  onCustomAmount: (value: string) => void
  onCustomCommit: () => void
}

export function SupportPreference(
  props: PopupPreferenceProps | OrderPreferenceProps
): ReactElement {
  if (props.variant === 'order') return <OrderSupportPreference {...props} />
  return <PopupSupportPreference {...props} />
}

function PopupSupportPreference({
  policy,
  quote,
  pendingMode = null,
  confirmed = null,
  onChange,
}: PopupPreferenceProps): ReactElement {
  const select = (mode: SupportPolicy['mode']): void => {
    onChange({ ...policy, mode })
  }
  const amount = (mode: SupportPolicy['mode'], percent = policy.percent): string | null => {
    if (quote === null) return null
    const fee = quotedSupportFee(mode, percent, quote)
    return fee === null ? null : formatDollars(fee)
  }

  return (
    <div role="radiogroup" aria-label="How much support to add" className="flex flex-col gap-2">
      <style>{CONTROL_FOCUS + CHIP_MOTION + STATUS_MOTION}</style>
      <Choice
        selected={policy.mode === 'default'}
        title="Lunchdrop default"
        detail="Leave the fee they calculate."
        amount={amount('default')}
        pending={pendingMode === 'default'}
        done={confirmed?.mode === 'default' ? confirmed.tick : 0}
        onSelect={() => {
          select('default')
        }}
      />
      <PercentChoice
        selected={policy.mode === 'percent'}
        percent={policy.percent}
        amount={policy.mode === 'percent' ? amount('percent') : null}
        pending={pendingMode === 'percent'}
        done={confirmed?.mode === 'percent' ? confirmed.tick : 0}
        onSelect={() => {
          select('percent')
        }}
        onPercent={percent => {
          onChange({ ...policy, mode: 'percent', percent })
        }}
      />
      <Choice
        selected={policy.mode === 'remaining'}
        title="Remaining subsidy"
        detail="Use the entire remaining subsidy."
        amount={amount('remaining')}
        pending={pendingMode === 'remaining'}
        done={confirmed?.mode === 'remaining' ? confirmed.tick : 0}
        onSelect={() => {
          select('remaining')
        }}
      />
      <Choice
        selected={policy.mode === 'skip'}
        title="None"
        detail="Always $0, even when subsidy is left."
        amount={amount('skip')}
        pending={pendingMode === 'skip'}
        done={confirmed?.mode === 'skip' ? confirmed.tick : 0}
        onSelect={() => {
          select('skip')
        }}
      />
    </div>
  )
}

function OrderSupportPreference({
  selection,
  quote,
  pendingMode = null,
  confirmed = null,
  customFocusToken,
  onChoice,
  onPercent,
  onCustomAmount,
  onCustomCommit,
}: OrderPreferenceProps): ReactElement {
  const amount = (
    mode: 'percent' | 'remaining' | 'skip',
    percent = selection.percent
  ): string | null => {
    if (quote === null) return null
    const fee = quotedSupportFee(mode, percent, quote)
    return fee === null ? null : formatDollars(fee)
  }
  const parsedCustom = parseSupportAmount(selection.customAmount)
  const customPreview =
    selection.choice === 'custom' || parsedCustom === null ? null : formatDollars(parsedCustom)

  return (
    <div role="radiogroup" aria-label="How much support to add" className="flex flex-col gap-2">
      <style>{CONTROL_FOCUS + CHIP_MOTION + STATUS_MOTION}</style>
      <ExpandingChoice
        selected={selection.choice === 'custom'}
        title="Custom"
        detail="A dollar amount for this order."
        amount={customPreview}
        pending={pendingMode === 'custom'}
        done={confirmed?.mode === 'custom' ? confirmed.tick : 0}
        onSelect={() => {
          onChoice('custom')
        }}
      >
        <CustomAmountEditor
          revealed={selection.choice === 'custom'}
          amount={selection.customAmount}
          focusToken={customFocusToken}
          onAmount={onCustomAmount}
          onCommit={onCustomCommit}
        />
      </ExpandingChoice>
      <PercentChoice
        selected={selection.choice === 'percent'}
        percent={selection.percent}
        amount={selection.choice === 'percent' ? amount('percent') : null}
        pending={pendingMode === 'percent'}
        done={confirmed?.mode === 'percent' ? confirmed.tick : 0}
        onSelect={() => {
          onChoice('percent')
        }}
        onPercent={onPercent}
      />
      <Choice
        selected={selection.choice === 'remaining'}
        title="Remaining subsidy"
        detail="Use the entire remaining subsidy."
        amount={amount('remaining')}
        pending={pendingMode === 'remaining'}
        done={confirmed?.mode === 'remaining' ? confirmed.tick : 0}
        onSelect={() => {
          onChoice('remaining')
        }}
      />
      <Choice
        selected={selection.choice === 'skip'}
        title="None"
        detail="Always $0, even when subsidy is left."
        amount={amount('skip')}
        pending={pendingMode === 'skip'}
        done={confirmed?.mode === 'skip' ? confirmed.tick : 0}
        onSelect={() => {
          onChoice('skip')
        }}
      />
    </div>
  )
}

function PercentChoice({
  selected,
  percent,
  amount,
  pending,
  done,
  onSelect,
  onPercent,
}: {
  selected: boolean
  percent: number
  amount: string | null
  pending: boolean
  done: number
  onSelect: () => void
  onPercent: (percent: number) => void
}): ReactElement {
  return (
    <ExpandingChoice
      selected={selected}
      title="Percentage"
      detail="A share of the item subtotal, before tax."
      amount={amount}
      pending={pending}
      done={done}
      onSelect={onSelect}
    >
      <PercentEditor revealed={selected} percent={percent} onChange={onPercent} />
    </ExpandingChoice>
  )
}
