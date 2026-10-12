import { browser } from 'wxt/browser'
import { parseHideTooltips } from './hide-tooltips'

export const HIDE_TOOLTIPS_STORAGE_KEY = 'hideTooltips'

export async function readHideTooltips(): Promise<boolean> {
  const stored = await browser.storage.local.get(HIDE_TOOLTIPS_STORAGE_KEY)
  return parseHideTooltips(stored[HIDE_TOOLTIPS_STORAGE_KEY])
}

export async function writeHideTooltips(enabled: boolean): Promise<void> {
  await browser.storage.local.set({ [HIDE_TOOLTIPS_STORAGE_KEY]: enabled })
}
