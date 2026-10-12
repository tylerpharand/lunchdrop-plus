import { useEffect, useState } from 'react'
import { browser } from 'wxt/browser'
import {
  defaultHideOrderSummary,
  parseHideOrderSummary,
  type HideOrderSummary,
} from '../lib/order-summary'
import {
  HIDE_ORDER_SUMMARY_STORAGE_KEY,
  readHideOrderSummary,
  writeHideOrderSummary,
} from '../lib/order-summary-storage'

export function useHideOrderSummary(): {
  preference: HideOrderSummary
  setPreference: (preference: HideOrderSummary) => void
} {
  const [preference, setPreferenceState] = useState<HideOrderSummary>(defaultHideOrderSummary)

  useEffect(() => {
    void readHideOrderSummary().then(setPreferenceState)

    const onStorageChanged = (changes: Record<string, { newValue?: unknown }>): void => {
      const change = changes[HIDE_ORDER_SUMMARY_STORAGE_KEY]
      if (change === undefined) return
      setPreferenceState(parseHideOrderSummary(change.newValue))
    }
    browser.storage.onChanged.addListener(onStorageChanged)
    return () => {
      browser.storage.onChanged.removeListener(onStorageChanged)
    }
  }, [])

  const setPreference = (next: HideOrderSummary): void => {
    setPreferenceState(next)
    void writeHideOrderSummary(next)
  }

  return { preference, setPreference }
}
