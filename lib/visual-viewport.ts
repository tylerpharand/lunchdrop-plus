export const COMPACT_VIEWPORT_MAX_WIDTH = 639

export interface VisualFrame {
  top: number
  left: number
  width: number
  height: number
}

export function visualFrame(): VisualFrame {
  const viewport = window.visualViewport
  if (viewport === null) {
    return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight }
  }
  return {
    top: viewport.offsetTop,
    left: viewport.offsetLeft,
    width: viewport.width,
    height: viewport.height,
  }
}

export function isCompactViewport(): boolean {
  return visualFrame().width <= COMPACT_VIEWPORT_MAX_WIDTH
}

/** Keep a fixed layer on the visible screen while the page scrolls or the browser chrome moves. */
export function bindVisualFrame(element: HTMLElement): () => void {
  let last = ''
  const apply = (): void => {
    const frame = visualFrame()
    const next = `${String(frame.top)}:${String(frame.left)}:${String(frame.width)}:${String(frame.height)}`
    if (next === last) return
    last = next
    element.style.position = 'fixed'
    element.style.top = `${String(frame.top)}px`
    element.style.left = `${String(frame.left)}px`
    element.style.width = `${String(frame.width)}px`
    element.style.height = `${String(frame.height)}px`
    element.style.right = 'auto'
    element.style.bottom = 'auto'
    element.style.maxWidth = 'none'
    element.style.setProperty('--lunchbot-frame-height', `${String(frame.height)}px`)
  }
  apply()
  const viewport = window.visualViewport
  viewport?.addEventListener('resize', apply)
  viewport?.addEventListener('scroll', apply)
  window.addEventListener('resize', apply)
  window.addEventListener('scroll', apply, { passive: true })
  return () => {
    viewport?.removeEventListener('resize', apply)
    viewport?.removeEventListener('scroll', apply)
    window.removeEventListener('resize', apply)
    window.removeEventListener('scroll', apply)
  }
}
