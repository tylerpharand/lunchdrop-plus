import { browser } from 'wxt/browser'
import { parseExtensionEnabled } from './extension-enabled'

export const EXTENSION_ENABLED_STORAGE_KEY = 'extensionEnabled'

export async function readExtensionEnabled(): Promise<boolean> {
  const stored = await browser.storage.local.get(EXTENSION_ENABLED_STORAGE_KEY)
  return parseExtensionEnabled(stored[EXTENSION_ENABLED_STORAGE_KEY])
}

export async function writeExtensionEnabled(enabled: boolean): Promise<void> {
  await browser.storage.local.set({ [EXTENSION_ENABLED_STORAGE_KEY]: enabled })
}
