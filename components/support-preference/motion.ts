import { useState } from 'react'

/**
 * True once `active` changes after `ready`.
 * The value in place when `ready` becomes true is the baseline and does not animate.
 */
export function useSwitchMotion(active: boolean, ready = true): boolean {
  const [settled, setSettled] = useState(active)
  const [armed, setArmed] = useState(false)
  const [primed, setPrimed] = useState(ready)

  if (!primed) {
    if (!ready) return false
    setPrimed(true)
    if (settled !== active) setSettled(active)
    return false
  }

  if (settled !== active) {
    setSettled(active)
    if (!armed) setArmed(true)
  }
  return armed || settled !== active
}
