import { useEffect, useState } from 'react'
import { browser } from 'wxt/browser'

export function useStoredValue<T>({
  initial,
  storageKey,
  read,
  write,
  parse,
}: {
  initial: T
  storageKey: string
  read: () => Promise<T>
  write: (value: T) => Promise<void>
  parse: (value: unknown) => T
}): { value: T; setValue: (value: T) => void } {
  const [value, setValueState] = useState(initial)

  useEffect(() => {
    void read().then(setValueState)

    const onStorageChanged = (changes: Record<string, { newValue?: unknown }>): void => {
      const change = changes[storageKey]
      if (change === undefined) return
      setValueState(parse(change.newValue))
    }
    browser.storage.onChanged.addListener(onStorageChanged)
    return () => {
      browser.storage.onChanged.removeListener(onStorageChanged)
    }
  }, [parse, read, storageKey])

  const setValue = (next: T): void => {
    setValueState(next)
    void write(next)
  }

  return { value, setValue }
}
