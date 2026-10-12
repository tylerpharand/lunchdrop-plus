import { browser } from 'wxt/browser'
import { parseHideNewBadges } from './new-badges'

export const HIDE_NEW_BADGES_STORAGE_KEY = 'hideNewBadges'

export async function readHideNewBadges(): Promise<boolean> {
  const stored = await browser.storage.local.get(HIDE_NEW_BADGES_STORAGE_KEY)
  return parseHideNewBadges(stored[HIDE_NEW_BADGES_STORAGE_KEY])
}

export async function writeHideNewBadges(enabled: boolean): Promise<void> {
  await browser.storage.local.set({ [HIDE_NEW_BADGES_STORAGE_KEY]: enabled })
}
