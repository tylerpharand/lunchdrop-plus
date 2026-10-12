import { parseSupportPolicy, type SupportPolicy } from '../lib/support-policy'
import {
  readSupportPolicy,
  SUPPORT_POLICY_STORAGE_KEY,
  writeSupportPolicy,
} from '../lib/support-policy-storage'
import { useStoredValue } from './use-stored-value'

export function useSupportPolicy(): {
  policy: SupportPolicy
  setPolicy: (policy: SupportPolicy) => void
} {
  const { value: policy, setValue: setPolicy } = useStoredValue({
    initial: { mode: 'default', percent: 10 },
    storageKey: SUPPORT_POLICY_STORAGE_KEY,
    read: readSupportPolicy,
    write: writeSupportPolicy,
    parse: parseSupportPolicy,
  })

  return { policy, setPolicy }
}
