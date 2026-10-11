import type { ReactElement } from 'react'
import {
  hiddenPromptIds,
  PAGE_PROMPTS,
  parsePagePromptMode,
  togglePagePrompt,
  withPromptMode,
  type HidePagePrompts,
} from '../lib/page-prompts'

interface HidePromptsSettingProps {
  preference: HidePagePrompts
  onChange: (preference: HidePagePrompts) => void
}

export function HidePromptsSetting({
  preference,
  onChange,
}: HidePromptsSettingProps): ReactElement {
  const hidden = hiddenPromptIds(preference)
  return (
    <div>
      <label className="block text-sm font-semibold text-zinc-900" htmlFor="hide-extra-prompts">
        Hide extra prompts
      </label>
      <p className="mt-0.5 text-sm leading-5 text-zinc-600">
        Reminders, meal ratings, referral offers, and invites. Order updates stay.
      </p>
      <div className="relative mt-3">
        <select
          id="hide-extra-prompts"
          value={preference.mode}
          onChange={event => {
            const mode = parsePagePromptMode(event.target.value)
            if (mode === null) return
            onChange(withPromptMode(preference, mode))
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
          {PAGE_PROMPTS.map(prompt => (
            <PromptSwitch
              key={prompt.id}
              label={prompt.label}
              hidden={hidden.has(prompt.id)}
              onToggle={() => {
                onChange(togglePagePrompt(preference, prompt.id))
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function PromptSwitch({
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
      <span
        className={`flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 ${
          hidden ? 'bg-[#009900]' : 'bg-zinc-300'
        }`}
        aria-hidden="true"
      >
        <span
          className={`h-4 w-4 rounded-full bg-white shadow-sm ${
            hidden ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </span>
      <span className="text-sm font-semibold text-zinc-900">{label}</span>
    </button>
  )
}
