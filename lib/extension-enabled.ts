export function defaultExtensionEnabled(): boolean {
  return true
}

export function parseExtensionEnabled(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  return defaultExtensionEnabled()
}
