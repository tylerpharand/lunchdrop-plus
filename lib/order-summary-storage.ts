import { browser } from 'wxt/browser'
import { parseHideOrderSummary, type HideOrderSummary } from './order-summary'

export const HIDE_ORDER_SUMMARY_STORAGE_KEY = 'hideOrderSummary'

export async function readHideOrderSummary(): Promise<HideOrderSummary> {
  const stored = await browser.storage.local.get(HIDE_ORDER_SUMMARY_STORAGE_KEY)
  return parseHideOrderSummary(stored[HIDE_ORDER_SUMMARY_STORAGE_KEY])
}

export async function writeHideOrderSummary(preference: HideOrderSummary): Promise<void> {
  await browser.storage.local.set({ [HIDE_ORDER_SUMMARY_STORAGE_KEY]: preference })
}
