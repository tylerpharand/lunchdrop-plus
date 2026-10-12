import {
  defaultCollapsePickupInstructions,
  parseCollapsePickupInstructions,
} from '../lib/collapse-pickup-instructions'
import {
  COLLAPSE_PICKUP_INSTRUCTIONS_STORAGE_KEY,
  readCollapsePickupInstructions,
  writeCollapsePickupInstructions,
} from '../lib/collapse-pickup-instructions-storage'
import { useStoredValue } from './use-stored-value'

export function useCollapsePickupInstructions(): {
  collapsePickupInstructions: boolean
  setCollapsePickupInstructions: (enabled: boolean) => void
} {
  const { value: collapsePickupInstructions, setValue: setCollapsePickupInstructions } =
    useStoredValue({
      initial: defaultCollapsePickupInstructions(),
      storageKey: COLLAPSE_PICKUP_INSTRUCTIONS_STORAGE_KEY,
      read: readCollapsePickupInstructions,
      write: writeCollapsePickupInstructions,
      parse: parseCollapsePickupInstructions,
    })

  return { collapsePickupInstructions, setCollapsePickupInstructions }
}
