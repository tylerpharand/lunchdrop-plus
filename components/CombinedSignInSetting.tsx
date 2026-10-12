import type { ReactElement } from 'react'
import { SettingSwitch } from './SettingSwitch'

interface CombinedSignInSettingProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
}

export function CombinedSignInSetting({
  enabled,
  onChange,
}: CombinedSignInSettingProps): ReactElement {
  return (
    <div className="mt-6 border-t border-zinc-200 pt-4">
      <SettingSwitch
        label="One-step sign in"
        checked={enabled}
        onToggle={() => {
          onChange(!enabled)
        }}
      />
      <p className="mt-2 text-sm leading-5 text-zinc-600">
        The sign-in page shows the email and password together, so a password manager can fill both.
        Leave the password blank to continue to company sign-in.
      </p>
    </div>
  )
}
