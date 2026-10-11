import { useEffect, useState } from 'react'
import { browser } from 'wxt/browser'
import {
  defaultHidePagePrompts,
  parseHidePagePrompts,
  type HidePagePrompts,
} from '../lib/page-prompts'
import {
  HIDE_PAGE_PROMPTS_STORAGE_KEY,
  readHidePagePrompts,
  writeHidePagePrompts,
} from '../lib/page-prompts-storage'

export function useHidePagePrompts(): {
  preference: HidePagePrompts
  setPreference: (preference: HidePagePrompts) => void
} {
  const [preference, setPreferenceState] = useState<HidePagePrompts>(defaultHidePagePrompts)

  useEffect(() => {
    void readHidePagePrompts().then(setPreferenceState)

    const onStorageChanged = (changes: Record<string, { newValue?: unknown }>): void => {
      const change = changes[HIDE_PAGE_PROMPTS_STORAGE_KEY]
      if (change === undefined) return
      setPreferenceState(parseHidePagePrompts(change.newValue))
    }
    browser.storage.onChanged.addListener(onStorageChanged)
    return () => {
      browser.storage.onChanged.removeListener(onStorageChanged)
    }
  }, [])

  const setPreference = (next: HidePagePrompts): void => {
    setPreferenceState(next)
    void writeHidePagePrompts(next)
  }

  return { preference, setPreference }
}
