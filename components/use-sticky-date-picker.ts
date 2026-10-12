import { defaultStickyDatePicker, parseStickyDatePicker } from '../lib/sticky-date-picker'
import {
  readStickyDatePicker,
  STICKY_DATE_PICKER_STORAGE_KEY,
  writeStickyDatePicker,
} from '../lib/sticky-date-picker-storage'
import { useStoredValue } from './use-stored-value'

export function useStickyDatePicker(): {
  stickyDatePicker: boolean
  setStickyDatePicker: (enabled: boolean) => void
} {
  const { value: stickyDatePicker, setValue: setStickyDatePicker } = useStoredValue({
    initial: defaultStickyDatePicker(),
    storageKey: STICKY_DATE_PICKER_STORAGE_KEY,
    read: readStickyDatePicker,
    write: writeStickyDatePicker,
    parse: parseStickyDatePicker,
  })

  return { stickyDatePicker, setStickyDatePicker }
}
