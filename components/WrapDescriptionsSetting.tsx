import type { ReactElement } from 'react'

interface WrapDescriptionsSettingProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
}

export function WrapDescriptionsSetting({
  enabled,
  onChange,
}: WrapDescriptionsSettingProps): ReactElement {
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
        <span
          className={`flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 ${
            enabled ? 'bg-[#009900]' : 'bg-zinc-300'
          }`}
          aria-hidden="true"
        >
          <span
            className={`h-4 w-4 rounded-full bg-white shadow-sm ${
              enabled ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </span>
        <span className="text-sm font-semibold text-zinc-900">Wrap long descriptions</span>
      </button>
      <p className="mt-2 text-sm leading-5 text-zinc-600">
        A long word in an item description wraps onto the next line.
      </p>
    </div>
  )
}
