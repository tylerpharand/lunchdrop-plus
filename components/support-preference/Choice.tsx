import type { MouseEvent, ReactElement } from 'react'
import { PriceStatus } from './PriceStatus'

export function suppressMouseFocus(event: MouseEvent<HTMLButtonElement>): void {
  event.preventDefault()
}

export function releaseMouseFocus(event: MouseEvent<HTMLButtonElement>): void {
  if (event.detail > 0) event.currentTarget.blur()
}

export function ExpandingChoice({
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

export function Choice({
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
          ? 'lunchbot-control relative flex w-full cursor-pointer items-start gap-3 rounded-xl text-left'
          : `lunchbot-option lunchbot-control relative flex w-full cursor-pointer items-start gap-3 rounded-2xl border p-3 text-left transition-colors ${
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
      {amount !== null ? (
        <span className="relative shrink-0 self-start text-sm font-semibold tabular-nums text-zinc-900">
          {amount}
          <span className="pointer-events-none absolute top-full right-0 mt-0.5 flex h-5 items-center">
            <PriceStatus pending={pending} done={done} />
          </span>
        </span>
      ) : (
        <span
          className={`pointer-events-none absolute top-0 flex h-5 items-center ${
            bare ? 'right-0' : 'right-3'
          }`}
        >
          <PriceStatus pending={pending} done={done} />
        </span>
      )}
    </button>
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
