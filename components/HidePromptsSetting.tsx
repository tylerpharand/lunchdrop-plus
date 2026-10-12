import type { ReactElement } from 'react'
import {
  hiddenPromptIds,
  PAGE_PROMPTS,
  parsePagePromptMode,
  togglePagePrompt,
  withPromptMode,
  type HidePagePrompts,
} from '../lib/page-prompts'
import { ModeSelect } from './ModeSelect'
import { SettingSwitch } from './SettingSwitch'

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
      <ModeSelect
        id="hide-extra-prompts"
        value={preference.mode}
        onChange={value => {
          const mode = parsePagePromptMode(value)
          if (mode === null) return
          onChange(withPromptMode(preference, mode))
        }}
      />
      {preference.mode === 'custom' ? (
        <div className="mt-3 flex flex-col gap-2">
          {PAGE_PROMPTS.map(prompt => (
            <SettingSwitch
              key={prompt.id}
              label={prompt.label}
              checked={hidden.has(prompt.id)}
              ariaLabel={`Hide ${prompt.label}`}
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
