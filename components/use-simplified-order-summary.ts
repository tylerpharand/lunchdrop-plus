import {
  defaultSimplifiedOrderSummary,
  parseSimplifiedOrderSummary,
} from '../lib/simplified-order-summary'
import {
  readSimplifiedOrderSummary,
  SIMPLIFIED_ORDER_SUMMARY_STORAGE_KEY,
  writeSimplifiedOrderSummary,
} from '../lib/simplified-order-summary-storage'
import { useStoredValue } from './use-stored-value'

export function useSimplifiedOrderSummary(): {
  simplifiedOrderSummary: boolean
  setSimplifiedOrderSummary: (enabled: boolean) => void
} {
  const { value: simplifiedOrderSummary, setValue: setSimplifiedOrderSummary } = useStoredValue({
    initial: defaultSimplifiedOrderSummary(),
    storageKey: SIMPLIFIED_ORDER_SUMMARY_STORAGE_KEY,
    read: readSimplifiedOrderSummary,
    write: writeSimplifiedOrderSummary,
    parse: parseSimplifiedOrderSummary,
  })

  return { simplifiedOrderSummary, setSimplifiedOrderSummary }
}
