import { useState } from 'react'

export function useSwitchMotion(active: boolean): boolean {
  const [settled, setSettled] = useState(active)
  const [armed, setArmed] = useState(false)
  if (settled !== active) {
    setSettled(active)
    if (!armed) setArmed(true)
  }
  return armed || settled !== active
}
