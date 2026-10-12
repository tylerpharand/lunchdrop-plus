export function defaultHideTooltips(): boolean {
  return true
}

export function parseHideTooltips(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  return defaultHideTooltips()
}
