import {
  defaultHideOrderSummary,
  parseHideOrderSummary,
  type HideOrderSummary,
} from '../lib/order-summary'
import {
  HIDE_ORDER_SUMMARY_STORAGE_KEY,
  readHideOrderSummary,
  writeHideOrderSummary,
} from '../lib/order-summary-storage'
import { useStoredValue } from './use-stored-value'

export function useHideOrderSummary(): {
  preference: HideOrderSummary
  setPreference: (preference: HideOrderSummary) => void
} {
  const { value: preference, setValue: setPreference } = useStoredValue({
    initial: defaultHideOrderSummary(),
    storageKey: HIDE_ORDER_SUMMARY_STORAGE_KEY,
    read: readHideOrderSummary,
    write: writeHideOrderSummary,
    parse: parseHideOrderSummary,
  })

  return { preference, setPreference }
}
