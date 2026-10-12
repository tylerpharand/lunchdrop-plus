export function defaultHideNewBadges(): boolean {
  return false
}

export function parseHideNewBadges(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  return defaultHideNewBadges()
}
