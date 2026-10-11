import { useEffect, useState } from 'react'
import { browser } from 'wxt/browser'
import { parseSupportPolicy, type SupportPolicy } from '../lib/support-policy'
import {
  readSupportPolicy,
  SUPPORT_POLICY_STORAGE_KEY,
  writeSupportPolicy,
} from '../lib/support-policy-storage'

export function useSupportPolicy(): {
  policy: SupportPolicy
  setPolicy: (policy: SupportPolicy) => void
} {
  const [policy, setPolicyState] = useState<SupportPolicy>({ mode: 'default', percent: 10 })

  useEffect(() => {
    void readSupportPolicy().then(setPolicyState)

    const onStorageChanged = (changes: Record<string, { newValue?: unknown }>): void => {
      const change = changes[SUPPORT_POLICY_STORAGE_KEY]
      if (change === undefined) return
      setPolicyState(parseSupportPolicy(change.newValue))
    }
    browser.storage.onChanged.addListener(onStorageChanged)
    return () => {
      browser.storage.onChanged.removeListener(onStorageChanged)
    }
  }, [])

  const setPolicy = (next: SupportPolicy): void => {
    setPolicyState(next)
    void writeSupportPolicy(next)
  }

  return { policy, setPolicy }
}
