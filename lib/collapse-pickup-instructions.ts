export function defaultCollapsePickupInstructions(): boolean {
  return true
}

export function parseCollapsePickupInstructions(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  return defaultCollapsePickupInstructions()
}
