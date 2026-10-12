import { defaultHideTooltips, parseHideTooltips } from '../lib/hide-tooltips'
import {
  HIDE_TOOLTIPS_STORAGE_KEY,
  readHideTooltips,
  writeHideTooltips,
} from '../lib/hide-tooltips-storage'
import { useStoredValue } from './use-stored-value'

export function useHideTooltips(): {
  hideTooltips: boolean
  setHideTooltips: (enabled: boolean) => void
} {
  const { value: hideTooltips, setValue: setHideTooltips } = useStoredValue({
    initial: defaultHideTooltips(),
    storageKey: HIDE_TOOLTIPS_STORAGE_KEY,
    read: readHideTooltips,
    write: writeHideTooltips,
    parse: parseHideTooltips,
  })

  return { hideTooltips, setHideTooltips }
}
