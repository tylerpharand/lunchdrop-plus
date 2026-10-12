export function defaultSimplifiedOrderSummary(): boolean {
  return true
}

export function parseSimplifiedOrderSummary(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  return defaultSimplifiedOrderSummary()
}
