import { browser } from 'wxt/browser'
import { parseWrapLongDescriptions } from './wrap-descriptions'

export const WRAP_LONG_DESCRIPTIONS_STORAGE_KEY = 'wrapLongDescriptions'

export async function readWrapLongDescriptions(): Promise<boolean> {
  const stored = await browser.storage.local.get(WRAP_LONG_DESCRIPTIONS_STORAGE_KEY)
  return parseWrapLongDescriptions(stored[WRAP_LONG_DESCRIPTIONS_STORAGE_KEY])
}

export async function writeWrapLongDescriptions(enabled: boolean): Promise<void> {
  await browser.storage.local.set({ [WRAP_LONG_DESCRIPTIONS_STORAGE_KEY]: enabled })
}
