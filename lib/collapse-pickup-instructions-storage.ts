import { browser } from 'wxt/browser'
import { parseCollapsePickupInstructions } from './collapse-pickup-instructions'

export const COLLAPSE_PICKUP_INSTRUCTIONS_STORAGE_KEY = 'collapsePickupInstructions'

export async function readCollapsePickupInstructions(): Promise<boolean> {
  const stored = await browser.storage.local.get(COLLAPSE_PICKUP_INSTRUCTIONS_STORAGE_KEY)
  return parseCollapsePickupInstructions(stored[COLLAPSE_PICKUP_INSTRUCTIONS_STORAGE_KEY])
}

export async function writeCollapsePickupInstructions(enabled: boolean): Promise<void> {
  await browser.storage.local.set({ [COLLAPSE_PICKUP_INSTRUCTIONS_STORAGE_KEY]: enabled })
}
