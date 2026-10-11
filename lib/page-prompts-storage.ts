import { browser } from 'wxt/browser'
import { parseHidePagePrompts, type HidePagePrompts } from './page-prompts'

export const HIDE_PAGE_PROMPTS_STORAGE_KEY = 'hidePagePrompts'

export async function readHidePagePrompts(): Promise<HidePagePrompts> {
  const stored = await browser.storage.local.get(HIDE_PAGE_PROMPTS_STORAGE_KEY)
  return parseHidePagePrompts(stored[HIDE_PAGE_PROMPTS_STORAGE_KEY])
}

export async function writeHidePagePrompts(preference: HidePagePrompts): Promise<void> {
  await browser.storage.local.set({ [HIDE_PAGE_PROMPTS_STORAGE_KEY]: preference })
}
