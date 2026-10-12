import { browser } from 'wxt/browser'
import { parseStickyDatePicker } from './sticky-date-picker'

export const STICKY_DATE_PICKER_STORAGE_KEY = 'stickyDatePicker'

export async function readStickyDatePicker(): Promise<boolean> {
  const stored = await browser.storage.local.get(STICKY_DATE_PICKER_STORAGE_KEY)
  return parseStickyDatePicker(stored[STICKY_DATE_PICKER_STORAGE_KEY])
}

export async function writeStickyDatePicker(enabled: boolean): Promise<void> {
  await browser.storage.local.set({ [STICKY_DATE_PICKER_STORAGE_KEY]: enabled })
}
