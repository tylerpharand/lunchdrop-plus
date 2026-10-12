import {
  defaultHidePagePrompts,
  parseHidePagePrompts,
  type HidePagePrompts,
} from '../lib/page-prompts'
import {
  HIDE_PAGE_PROMPTS_STORAGE_KEY,
  readHidePagePrompts,
  writeHidePagePrompts,
} from '../lib/page-prompts-storage'
import { useStoredValue } from './use-stored-value'

export function useHidePagePrompts(): {
  preference: HidePagePrompts
  setPreference: (preference: HidePagePrompts) => void
} {
  const { value: preference, setValue: setPreference } = useStoredValue({
    initial: defaultHidePagePrompts(),
    storageKey: HIDE_PAGE_PROMPTS_STORAGE_KEY,
    read: readHidePagePrompts,
    write: writeHidePagePrompts,
    parse: parseHidePagePrompts,
  })

  return { preference, setPreference }
}
