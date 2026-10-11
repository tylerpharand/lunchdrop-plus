const listeners = new Set<(supportLabel: string) => void>()

export function openSupportModal(supportLabel: string): void {
  for (const listener of listeners) listener(supportLabel)
}

export function onSupportModalOpen(listener: (supportLabel: string) => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
