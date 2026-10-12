import { browser } from 'wxt/browser'
import { parseCombinedSignIn } from './combined-sign-in'

export const COMBINED_SIGN_IN_STORAGE_KEY = 'combinedSignIn'

export async function readCombinedSignIn(): Promise<boolean> {
  const stored = await browser.storage.local.get(COMBINED_SIGN_IN_STORAGE_KEY)
  return parseCombinedSignIn(stored[COMBINED_SIGN_IN_STORAGE_KEY])
}

export async function writeCombinedSignIn(enabled: boolean): Promise<void> {
  await browser.storage.local.set({ [COMBINED_SIGN_IN_STORAGE_KEY]: enabled })
}
