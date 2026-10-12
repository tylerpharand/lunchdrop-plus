export function defaultStickyDatePicker(): boolean {
  return true
}

export function parseStickyDatePicker(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (isRecord(value) && typeof value['enabled'] === 'boolean') return value['enabled']
  return defaultStickyDatePicker()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
