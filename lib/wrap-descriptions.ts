export function defaultWrapLongDescriptions(): boolean {
  return true
}

export function parseWrapLongDescriptions(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  return defaultWrapLongDescriptions()
}
