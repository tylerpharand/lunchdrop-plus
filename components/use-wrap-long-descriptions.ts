import { useEffect, useState } from 'react'
import { browser } from 'wxt/browser'
import { defaultWrapLongDescriptions, parseWrapLongDescriptions } from '../lib/wrap-descriptions'
import {
  readWrapLongDescriptions,
  WRAP_LONG_DESCRIPTIONS_STORAGE_KEY,
  writeWrapLongDescriptions,
} from '../lib/wrap-descriptions-storage'

export function useWrapLongDescriptions(): {
  wrapLongDescriptions: boolean
  setWrapLongDescriptions: (enabled: boolean) => void
} {
  const [wrapLongDescriptions, setWrapLongDescriptionsState] = useState(defaultWrapLongDescriptions)

  useEffect(() => {
    void readWrapLongDescriptions().then(setWrapLongDescriptionsState)

    const onStorageChanged = (changes: Record<string, { newValue?: unknown }>): void => {
      const change = changes[WRAP_LONG_DESCRIPTIONS_STORAGE_KEY]
      if (change === undefined) return
      setWrapLongDescriptionsState(parseWrapLongDescriptions(change.newValue))
    }
    browser.storage.onChanged.addListener(onStorageChanged)
    return () => {
      browser.storage.onChanged.removeListener(onStorageChanged)
    }
  }, [])

  const setWrapLongDescriptions = (enabled: boolean): void => {
    setWrapLongDescriptionsState(enabled)
    void writeWrapLongDescriptions(enabled)
  }

  return { wrapLongDescriptions, setWrapLongDescriptions }
}
