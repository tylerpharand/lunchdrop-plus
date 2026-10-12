import { defaultWrapLongDescriptions, parseWrapLongDescriptions } from '../lib/wrap-descriptions'
import {
  readWrapLongDescriptions,
  WRAP_LONG_DESCRIPTIONS_STORAGE_KEY,
  writeWrapLongDescriptions,
} from '../lib/wrap-descriptions-storage'
import { useStoredValue } from './use-stored-value'

export function useWrapLongDescriptions(): {
  wrapLongDescriptions: boolean
  setWrapLongDescriptions: (enabled: boolean) => void
} {
  const { value: wrapLongDescriptions, setValue: setWrapLongDescriptions } = useStoredValue({
    initial: defaultWrapLongDescriptions(),
    storageKey: WRAP_LONG_DESCRIPTIONS_STORAGE_KEY,
    read: readWrapLongDescriptions,
    write: writeWrapLongDescriptions,
    parse: parseWrapLongDescriptions,
  })

  return { wrapLongDescriptions, setWrapLongDescriptions }
}
