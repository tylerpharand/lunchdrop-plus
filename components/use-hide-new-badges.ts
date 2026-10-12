import { defaultHideNewBadges, parseHideNewBadges } from '../lib/new-badges'
import {
  HIDE_NEW_BADGES_STORAGE_KEY,
  readHideNewBadges,
  writeHideNewBadges,
} from '../lib/new-badges-storage'
import { useStoredValue } from './use-stored-value'

export function useHideNewBadges(): {
  hideNewBadges: boolean
  setHideNewBadges: (enabled: boolean) => void
} {
  const { value: hideNewBadges, setValue: setHideNewBadges } = useStoredValue({
    initial: defaultHideNewBadges(),
    storageKey: HIDE_NEW_BADGES_STORAGE_KEY,
    read: readHideNewBadges,
    write: writeHideNewBadges,
    parse: parseHideNewBadges,
  })

  return { hideNewBadges, setHideNewBadges }
}
