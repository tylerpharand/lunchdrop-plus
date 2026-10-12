import { defaultExtensionEnabled, parseExtensionEnabled } from '../lib/extension-enabled'
import {
  EXTENSION_ENABLED_STORAGE_KEY,
  readExtensionEnabled,
  writeExtensionEnabled,
} from '../lib/extension-enabled-storage'
import { useStoredValue } from './use-stored-value'

export function useExtensionEnabled(): {
  extensionEnabled: boolean
  setExtensionEnabled: (enabled: boolean) => void
} {
  const { value: extensionEnabled, setValue: setExtensionEnabled } = useStoredValue({
    initial: defaultExtensionEnabled(),
    storageKey: EXTENSION_ENABLED_STORAGE_KEY,
    read: readExtensionEnabled,
    write: writeExtensionEnabled,
    parse: parseExtensionEnabled,
  })

  return { extensionEnabled, setExtensionEnabled }
}
