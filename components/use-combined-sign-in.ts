import { defaultCombinedSignIn, parseCombinedSignIn } from '../lib/combined-sign-in'
import {
  COMBINED_SIGN_IN_STORAGE_KEY,
  readCombinedSignIn,
  writeCombinedSignIn,
} from '../lib/combined-sign-in-storage'
import { useStoredValue } from './use-stored-value'

export function useCombinedSignIn(): {
  combinedSignIn: boolean
  setCombinedSignIn: (enabled: boolean) => void
} {
  const { value: combinedSignIn, setValue: setCombinedSignIn } = useStoredValue({
    initial: defaultCombinedSignIn(),
    storageKey: COMBINED_SIGN_IN_STORAGE_KEY,
    read: readCombinedSignIn,
    write: writeCombinedSignIn,
    parse: parseCombinedSignIn,
  })

  return { combinedSignIn, setCombinedSignIn }
}
