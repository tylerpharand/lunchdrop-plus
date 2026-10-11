import { useEffect, useState } from 'react'
import { browser } from 'wxt/browser'
import { parseHidePagePrompts } from '../lib/page-prompts'
import {
  HIDE_PAGE_PROMPTS_STORAGE_KEY,
  readHidePagePrompts,
  writeHidePagePrompts,
} from '../lib/page-prompts-storage'

export function useHidePagePrompts(): {
  hide: boolean
  setHide: (hide: boolean) => void
} {
  const [hide, setHideState] = useState(false)

  useEffect(() => {
    void readHidePagePrompts().then(setHideState)

    const onStorageChanged = (changes: Record<string, { newValue?: unknown }>): void => {
      const change = changes[HIDE_PAGE_PROMPTS_STORAGE_KEY]
      if (change === undefined) return
      setHideState(parseHidePagePrompts(change.newValue))
    }
    browser.storage.onChanged.addListener(onStorageChanged)
    return () => {
      browser.storage.onChanged.removeListener(onStorageChanged)
    }
  }, [])

  const setHide = (next: boolean): void => {
    setHideState(next)
    void writeHidePagePrompts(next)
  }

  return { hide, setHide }
}
