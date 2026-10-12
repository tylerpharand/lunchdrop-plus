import { browser } from 'wxt/browser'
import { parseSimplifiedOrderSummary } from './simplified-order-summary'

export const SIMPLIFIED_ORDER_SUMMARY_STORAGE_KEY = 'simplifiedOrderSummary'

export async function readSimplifiedOrderSummary(): Promise<boolean> {
  const stored = await browser.storage.local.get(SIMPLIFIED_ORDER_SUMMARY_STORAGE_KEY)
  return parseSimplifiedOrderSummary(stored[SIMPLIFIED_ORDER_SUMMARY_STORAGE_KEY])
}

export async function writeSimplifiedOrderSummary(enabled: boolean): Promise<void> {
  await browser.storage.local.set({ [SIMPLIFIED_ORDER_SUMMARY_STORAGE_KEY]: enabled })
}
