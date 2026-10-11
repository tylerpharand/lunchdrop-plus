import type { ReactElement } from 'react'

interface HidePromptsSettingProps {
  hide: boolean
  onChange: (hide: boolean) => void
}

export function HidePromptsSetting({ hide, onChange }: HidePromptsSettingProps): ReactElement {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={hide}
      onClick={() => {
        onChange(!hide)
      }}
      className="flex w-full items-start gap-3 rounded-2xl bg-white p-3 text-left ring-1 ring-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#009900]"
    >
      <span
        className={`mt-0.5 flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 ${
          hide ? 'bg-[#009900]' : 'bg-zinc-300'
        }`}
        aria-hidden="true"
      >
        <span
          className={`h-5 w-5 rounded-full bg-white shadow-sm ${
            hide ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </span>
      <span>
        <span className="block text-sm font-semibold text-zinc-900">Hide extra prompts</span>
        <span className="mt-0.5 block text-sm leading-5 text-zinc-600">
          Reminders, meal ratings, referral offers, and invites. Order updates stay.
        </span>
      </span>
    </button>
  )
}
