export function defaultCombinedSignIn(): boolean {
  return false
}

export function parseCombinedSignIn(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  return defaultCombinedSignIn()
}
