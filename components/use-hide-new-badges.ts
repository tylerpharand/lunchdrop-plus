import { useEffect, useState } from 'react'
import { browser } from 'wxt/browser'
import { defaultHideNewBadges, parseHideNewBadges } from '../lib/new-badges'
import {
  HIDE_NEW_BADGES_STORAGE_KEY,
  readHideNewBadges,
  writeHideNewBadges,
} from '../lib/new-badges-storage'

export function useHideNewBadges(): {
  hideNewBadges: boolean
  setHideNewBadges: (enabled: boolean) => void
} {
  const [hideNewBadges, setHideNewBadgesState] = useState(defaultHideNewBadges)

  useEffect(() => {
    void readHideNewBadges().then(setHideNewBadgesState)

    const onStorageChanged = (changes: Record<string, { newValue?: unknown }>): void => {
      const change = changes[HIDE_NEW_BADGES_STORAGE_KEY]
      if (change === undefined) return
      setHideNewBadgesState(parseHideNewBadges(change.newValue))
    }
    browser.storage.onChanged.addListener(onStorageChanged)
    return () => {
      browser.storage.onChanged.removeListener(onStorageChanged)
    }
  }, [])

  const setHideNewBadges = (enabled: boolean): void => {
    setHideNewBadgesState(enabled)
    void writeHideNewBadges(enabled)
  }

  return { hideNewBadges, setHideNewBadges }
}
