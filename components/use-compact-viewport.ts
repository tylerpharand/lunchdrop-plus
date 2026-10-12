import { useEffect, useState } from 'react'
import { isCompactViewport } from '../lib/visual-viewport'

export function useCompactViewport(): boolean {
  const [compact, setCompact] = useState(isCompactViewport)

  useEffect(() => {
    const apply = (): void => {
      const next = isCompactViewport()
      setCompact(current => (current === next ? current : next))
    }
    const viewport = window.visualViewport
    viewport?.addEventListener('resize', apply)
    window.addEventListener('resize', apply)
    return () => {
      viewport?.removeEventListener('resize', apply)
      window.removeEventListener('resize', apply)
    }
  }, [])

  return compact
}
