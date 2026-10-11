import { useEffect, useRef, useState, type MouseEvent, type ReactElement } from 'react'
import {
  formatDollars,
  parseSupportAmount,
  quotedSupportFee,
  SUPPORT_PERCENT_CHOICES,
  type OrderSupportChoice,
  type SupportChoiceMode,
  type SupportPolicy,
  type SupportQuote,
} from '../lib/support-policy'

function suppressMouseFocus(event: MouseEvent<HTMLButtonElement>): void {
  event.preventDefault()
}

function releaseMouseFocus(event: MouseEvent<HTMLButtonElement>): void {
  if (event.detail > 0) event.currentTarget.blur()
}

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

function CustomAmountEditor({
  revealed,
  amount,
  focusToken,
  onAmount,
  onCommit,
}: {
  revealed: boolean
  amount: string
  focusToken: number
  onAmount: (value: string) => void
  onCommit: () => void
}): ReactElement {
  const inputRef = useRef<HTMLInputElement>(null)
  const animate = useSwitchMotion(revealed)
  useEffect(() => {
    if (!revealed || focusToken === 0) return
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [focusToken, revealed])

  return (
    <div className="pt-3">
      <label
        className={`flex items-center gap-1 rounded-xl bg-white px-3 py-2 ring-1 ring-zinc-200 focus-within:ring-[#009900] ${
          animate && revealed ? 'lunchbot-chip-in' : ''
        } ${animate && !revealed ? 'lunchbot-chip-out' : ''} ${!animate && !revealed ? 'opacity-0' : ''}`}
      >
        <span className="text-sm font-semibold text-zinc-500" aria-hidden="true">
          $
        </span>
        <input
          ref={inputRef}
          value={amount}
          inputMode="decimal"
          autoComplete="off"
          aria-label="Custom support amount"
          onChange={event => {
            onAmount(event.target.value)
          }}
          onBlur={onCommit}
          onKeyDown={event => {
            if (event.key !== 'Enter') return
            event.currentTarget.blur()
          }}
          className="w-full bg-transparent text-sm font-semibold text-zinc-900 tabular-nums outline-none"
        />
      </label>
    </div>
  )
}

function ExpandingChoice({
  selected,
  title,
  detail,
  amount,
  pending,
  done,
  onSelect,
  children,
}: {
  selected: boolean
  title: string
  detail: string
  amount: string | null
  pending: boolean
  done: number
  onSelect: () => void
  children: ReactElement | null
}): ReactElement {
  return (
    <div
      onClick={event => {
        // Padding lives on this card, outside the radio button.
        if (event.target !== event.currentTarget) return
        onSelect()
      }}
      className={
        selected
          ? 'lunchbot-option cursor-pointer overflow-hidden rounded-2xl border border-[#009900]/30 bg-[#009900]/10 p-3 transition-colors hover:border-[#009900]/55 active:border-[#009900] has-[:active]:border-[#009900]'
          : 'lunchbot-option cursor-pointer overflow-hidden rounded-2xl border border-zinc-200 bg-white p-3 transition-colors hover:border-zinc-400 active:border-zinc-500 has-[:active]:border-zinc-500'
      }
    >
      <Choice
        bare
        selected={selected}
        title={title}
        detail={detail}
        amount={amount}
        pending={pending}
        done={done}
        onSelect={onSelect}
      />
      <Reveal open={selected}>{children}</Reveal>
    </div>
  )
}

function Reveal({
  open,
  children,
}: {
  open: boolean
  children: ReactElement | null
}): ReactElement {
  return (
    <div
      className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
        open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
      }`}
    >
      <div className="min-h-0 overflow-visible" inert={!open}>
        {children}
      </div>
    </div>
  )
}

function Choice({
  selected,
  title,
  detail,
  amount,
  pending,
  done,
  onSelect,
  bare = false,
}: {
  selected: boolean
  title: string
  detail: string
  amount: string | null
  pending: boolean
  done: number
  onSelect: () => void
  bare?: boolean
}): ReactElement {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onMouseDown={suppressMouseFocus}
      onClick={event => {
        onSelect()
        releaseMouseFocus(event)
      }}
      className={
        bare
          ? 'lunchbot-control flex w-full cursor-pointer items-start gap-3 rounded-xl text-left'
          : `lunchbot-option lunchbot-control flex w-full cursor-pointer items-start gap-3 rounded-2xl border p-3 text-left transition-colors ${
              selected
                ? 'border-[#009900]/30 bg-[#009900]/10 hover:border-[#009900]/55 active:border-[#009900]'
                : 'border-zinc-200 bg-white hover:border-zinc-400 active:border-zinc-500'
            }`
      }
    >
      <Mark selected={selected} />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-zinc-900">{title}</span>
        <span className="mt-0.5 block text-sm leading-5 text-zinc-600">{detail}</span>
      </span>
      {amount !== null || pending ? (
        <span className="flex shrink-0 items-center">
          <PriceStatus pending={pending} done={done} />
          {amount !== null ? (
            <span className="text-sm font-semibold tabular-nums text-zinc-900">{amount}</span>
          ) : null}
        </span>
      ) : null}
    </button>
  )
}

const STATUS_HOLD_MS = 620
const STATUS_LEAVE_MS = 200

function PriceStatus({ pending, done }: { pending: boolean; done: number }): ReactElement | null {
  const [phase, setPhase] = useState<'idle' | 'spin' | 'check' | 'leave' | 'dismiss'>('idle')
  const [seenDone, setSeenDone] = useState(0)

  if (pending && phase !== 'spin') {
    setPhase('spin')
  } else if (!pending && phase === 'spin') {
    if (done > seenDone) {
      setSeenDone(done)
      setPhase('check')
    } else {
      setPhase('dismiss')
    }
  }

  useEffect(() => {
    if (phase === 'check') {
      const timer = window.setTimeout(() => {
        setPhase('leave')
      }, STATUS_HOLD_MS)
      return () => {
        window.clearTimeout(timer)
      }
    }
    if (phase === 'leave' || phase === 'dismiss') {
      const timer = window.setTimeout(() => {
        setPhase('idle')
      }, STATUS_LEAVE_MS)
      return () => {
        window.clearTimeout(timer)
      }
    }
    return undefined
  }, [phase])

  if (phase === 'idle') return null

  const spinning = phase === 'spin' || phase === 'dismiss' || phase === 'check'
  const showingCheck = phase === 'check' || phase === 'leave'

  return (
    <span
      className="mr-1.5 grid h-3.5 w-3.5 place-items-center overflow-visible"
      role="status"
      aria-label={showingCheck ? 'Support updated' : 'Updating this order'}
      data-lunchbot-support-pending={phase === 'spin' ? 'true' : undefined}
      data-lunchbot-support-done={showingCheck ? 'true' : undefined}
    >
      {spinning ? (
        <span
          className={`col-start-1 row-start-1 ${
            phase === 'spin'
              ? 'lunchbot-mark-in'
              : phase === 'check'
                ? 'lunchbot-mark-swap'
                : 'lunchbot-mark-out'
          }`}
        >
          <span className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-200 border-t-[#009900] motion-reduce:animate-none" />
        </span>
      ) : null}
      {showingCheck ? (
        <svg
          viewBox="0 0 16 16"
          className={`col-start-1 row-start-1 h-3.5 w-3.5 fill-none stroke-[#009900] stroke-2 ${
            phase === 'leave' ? 'lunchbot-mark-out' : 'lunchbot-check-in'
          }`}
          aria-hidden="true"
        >
          <path d="M3.5 8.5 6.5 11.5 12.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </span>
  )
}

function Mark({ selected }: { selected: boolean }): ReactElement {
  return (
    <span
      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
        selected ? 'border-[#009900] bg-[#009900] text-white' : 'border-zinc-300 bg-white'
      }`}
      aria-hidden="true"
    >
      {selected ? (
        <svg viewBox="0 0 16 16" className="h-3 w-3 fill-none stroke-current stroke-2">
          <path d="M3.5 8.5 6.5 11.5 12.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </span>
  )
}

export function useSwitchMotion(active: boolean): boolean {
  const [settled, setSettled] = useState(active)
  const [armed, setArmed] = useState(false)
  if (settled !== active) {
    setSettled(active)
    if (!armed) setArmed(true)
  }
  return armed || settled !== active
}

function PercentEditor({
  revealed,
  percent,
  onChange,
}: {
  revealed: boolean
  percent: number
  onChange: (percent: number) => void
}): ReactElement {
  const animate = useSwitchMotion(revealed)
  return (
    <div className="grid grid-cols-4 gap-1.5 pt-3">
      {SUPPORT_PERCENT_CHOICES.map(choice => (
        <button
          key={choice}
          type="button"
          aria-pressed={percent === choice}
          tabIndex={-1}
          onMouseDown={suppressMouseFocus}
          onClick={event => {
            onChange(choice)
            releaseMouseFocus(event)
          }}
          className={`lunchbot-control cursor-pointer rounded-full px-2 py-1.5 text-sm font-semibold ${
            animate && revealed ? 'lunchbot-chip-in' : ''
          } ${animate && !revealed ? 'lunchbot-chip-out' : ''} ${
            !animate && !revealed ? 'opacity-0' : ''
          } ${revealed ? '' : 'pointer-events-none'} ${
            percent === choice
              ? 'bg-[#009900] text-white hover:bg-[#007a00] active:bg-[#006600]'
              : 'bg-white text-zinc-700 ring-1 ring-zinc-200 hover:ring-zinc-400 active:ring-zinc-500'
          }`}
        >
          {choice}%
        </button>
      ))}
    </div>
  )
}

const CHIP_MOTION = `
  @keyframes lunchbot-chip-in {
    from {
      opacity: 0;
      translate: 0 -0.25rem;
    }
    to {
      opacity: 1;
      translate: 0 0;
    }
  }
  @keyframes lunchbot-chip-out {
    from {
      opacity: 1;
      translate: 0 0;
    }
    to {
      opacity: 0;
      translate: 0 -0.25rem;
    }
  }
  .lunchbot-chip-in,
  .lunchbot-chip-out {
    animation-duration: 300ms;
    animation-timing-function: ease-out;
    animation-fill-mode: both;
  }
  .lunchbot-chip-in {
    animation-name: lunchbot-chip-in;
  }
  .lunchbot-chip-out {
    animation-name: lunchbot-chip-out;
  }
  @media (prefers-reduced-motion: reduce) {
    .lunchbot-chip-in,
    .lunchbot-chip-out {
      animation: none;
      translate: none;
    }
    .lunchbot-chip-in {
      opacity: 1;
    }
    .lunchbot-chip-out {
      opacity: 0;
    }
  }
`

const STATUS_MOTION = `
  @keyframes lunchbot-mark-in {
    from {
      opacity: 0;
      scale: 0.6;
    }
    to {
      opacity: 1;
      scale: 1;
    }
  }
  @keyframes lunchbot-mark-out {
    from {
      opacity: 1;
      scale: 1;
    }
    to {
      opacity: 0;
      scale: 0.6;
    }
  }
  @keyframes lunchbot-mark-swap {
    from {
      opacity: 1;
      scale: 1;
    }
    to {
      opacity: 0;
      scale: 0.85;
    }
  }
  @keyframes lunchbot-check-in {
    0% {
      opacity: 0;
      scale: 0.82;
    }
    42% {
      opacity: 1;
      scale: 1.24;
    }
    100% {
      opacity: 1;
      scale: 1;
    }
  }
  .lunchbot-mark-in,
  .lunchbot-mark-out,
  .lunchbot-mark-swap,
  .lunchbot-check-in {
    animation-timing-function: ease-out;
    animation-fill-mode: both;
  }
  .lunchbot-mark-in,
  .lunchbot-mark-out {
    animation-duration: 200ms;
  }
  .lunchbot-mark-swap {
    animation-duration: 90ms;
  }
  .lunchbot-check-in {
    animation-duration: 360ms;
  }
  .lunchbot-mark-in {
    animation-name: lunchbot-mark-in;
  }
  .lunchbot-mark-out {
    animation-name: lunchbot-mark-out;
  }
  .lunchbot-mark-swap {
    animation-name: lunchbot-mark-swap;
  }
  .lunchbot-check-in {
    animation-name: lunchbot-check-in;
  }
  @media (prefers-reduced-motion: reduce) {
    .lunchbot-mark-in,
    .lunchbot-mark-out,
    .lunchbot-mark-swap,
    .lunchbot-check-in {
      animation: none;
    }
    .lunchbot-mark-in,
    .lunchbot-check-in {
      opacity: 1;
      scale: 1;
    }
    .lunchbot-mark-out,
    .lunchbot-mark-swap {
      opacity: 0;
      scale: 1;
    }
  }
`

const CONTROL_FOCUS = `
  .lunchbot-control:focus,
  .lunchbot-control:focus-visible,
  .lunchbot-option > .lunchbot-control:focus,
  .lunchbot-option > .lunchbot-control:focus-visible {
    outline: none;
  }
  button.lunchbot-option:focus-visible,
  .lunchbot-option:has(> .lunchbot-control:focus-visible) {
    outline: none;
    border-color: #009900;
    box-shadow: inset 0 0 0 1px #009900;
  }
`
