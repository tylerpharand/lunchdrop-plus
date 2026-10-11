import type { ReactElement } from 'react'
import { HidePromptsSetting } from '../../components/HidePromptsSetting'
import { SupportPreference } from '../../components/SupportPreference'
import { useHidePagePrompts } from '../../components/use-hide-page-prompts'
import { useSupportPolicy } from '../../components/use-support-policy'

export default function App(): ReactElement {
  const { policy, setPolicy } = useSupportPolicy()
  const { hide, setHide } = useHidePagePrompts()

  return (
    <main className="bg-white p-4 font-sans text-zinc-900 antialiased">
      <h1 className="text-base font-semibold tracking-tight">Lunchdrop+</h1>
      <h2 className="mt-4 text-sm font-semibold text-zinc-900">Support</h2>
      <p className="mt-1 mb-3 text-sm leading-5 text-zinc-600">
        Saved for the next order you place.
      </p>
      <SupportPreference policy={policy} quote={null} onChange={setPolicy} />
      <div className="mt-4 border-t border-zinc-200 pt-4">
        <HidePromptsSetting hide={hide} onChange={setHide} />
      </div>
    </main>
  )
}
