import type { ReactElement } from 'react'

export function ModeSelect({
  id,
  value,
  onChange,
}: {
  id: string
  value: string
  onChange: (value: string) => void
}): ReactElement {
  return (
    <div className="relative mt-3">
      <select
        id={id}
        value={value}
        onChange={event => {
          onChange(event.target.value)
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
  )
}
