const STYLE_ID = 'lunchbot-collapse-pickup'
const STATE_ATTR = 'data-lunchbot-pickup'
const TOGGLE_ATTR = 'data-lunchbot-pickup-toggle'
const CHAMFER_ATTR = 'data-lunchbot-pickup-chamfer'
const MOTION_ATTR = 'data-lunchbot-pickup-motion'
const LABEL = 'Pickup Instructions'

// The note is a text node under the label. The address is the next element in the same block.
const PICKUP_CSS = `
[${STATE_ATTR}] {
  overflow: hidden !important;
}
[${MOTION_ATTR}="true"] {
  transition: max-height 0.22s ease !important;
}
[${TOGGLE_ATTR}="true"] {
  display: flex !important;
  align-items: center !important;
  gap: 0.4em !important;
  width: 100% !important;
  box-sizing: border-box !important;
  cursor: pointer !important;
  user-select: none !important;
  -webkit-tap-highlight-color: transparent !important;
}
[${TOGGLE_ATTR}="true"]:focus-visible {
  outline: 2px solid #009900 !important;
  outline-offset: 2px !important;
}
svg[${CHAMFER_ATTR}="true"] {
  width: 0.8em !important;
  height: 0.8em !important;
  flex: none !important;
  display: block !important;
  transition: transform 0.22s ease !important;
}
[${STATE_ATTR}="open"] svg[${CHAMFER_ATTR}="true"] {
  transform: rotate(90deg) !important;
}
@media (prefers-reduced-motion: reduce) {
  [${MOTION_ATTR}="true"],
  svg[${CHAMFER_ATTR}="true"] {
    transition: none !important;
  }
}
`

const bound = new WeakSet<HTMLElement>()
let listening = false

export function syncCollapsePickupInstructions(enabled: boolean): void {
  if (!enabled) {
    removeCollapsePickupInstructions()
    return
  }
  ensureStyles()
  ensureListening()
  for (const heading of document.querySelectorAll('div.font-medium.text-gray-400')) {
    if (!isPickupHeading(heading)) continue
    const block = pickupBlock(heading)
    if (block === null) continue
    ensureBlock(block, heading)
  }
}

export function removeCollapsePickupInstructions(): void {
  listening = false
  document.removeEventListener('click', onClick)
  document.removeEventListener('keydown', onKeyDown)
  document.getElementById(STYLE_ID)?.remove()
  for (const chamfer of document.querySelectorAll(`[${CHAMFER_ATTR}]`)) chamfer.remove()
  for (const toggle of document.querySelectorAll(`[${TOGGLE_ATTR}]`)) {
    if (!(toggle instanceof HTMLElement)) continue
    restoreLabel(toggle)
    toggle.removeAttribute(TOGGLE_ATTR)
    toggle.removeAttribute('role')
    toggle.removeAttribute('tabindex')
    toggle.removeAttribute('aria-expanded')
  }
  for (const block of document.querySelectorAll(`[${STATE_ATTR}]`)) {
    if (!(block instanceof HTMLElement)) continue
    block.removeAttribute(STATE_ATTR)
    block.removeAttribute(MOTION_ATTR)
    block.style.maxHeight = ''
  }
}

function ensureBlock(block: HTMLElement, heading: HTMLElement): void {
  heading.setAttribute(TOGGLE_ATTR, 'true')
  heading.setAttribute('role', 'button')
  heading.tabIndex = 0
  normalizeLabel(heading)
  ensureChamfer(heading)
  bindMotion(block)
  const state = block.getAttribute(STATE_ATTR)
  if (state !== 'open' && state !== 'closed') {
    block.setAttribute(STATE_ATTR, 'closed')
    heading.setAttribute('aria-expanded', 'false')
    const height = collapsedHeight(heading)
    if (height > 0) block.style.maxHeight = pixels(height)
    armMotion(block)
    return
  }
  heading.setAttribute('aria-expanded', state === 'open' ? 'true' : 'false')
  if (state === 'closed') {
    const height = collapsedHeight(heading)
    if (height > 0) block.style.maxHeight = pixels(height)
  }
  armMotion(block)
}

function ensureChamfer(heading: HTMLElement): void {
  if (heading.querySelector(`[${CHAMFER_ATTR}]`) !== null) return
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 16 16')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute(CHAMFER_ATTR, 'true')
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', 'M6 3.25 11.25 8 6 12.75')
  path.setAttribute('fill', 'none')
  path.setAttribute('stroke', 'currentColor')
  path.setAttribute('stroke-width', '1.75')
  path.setAttribute('stroke-linecap', 'round')
  path.setAttribute('stroke-linejoin', 'round')
  svg.append(path)
  heading.append(svg)
}

function bindMotion(block: HTMLElement): void {
  if (bound.has(block)) return
  bound.add(block)
  block.addEventListener('transitionend', onTransitionEnd)
}

function armMotion(block: HTMLElement): void {
  if (block.getAttribute(MOTION_ATTR) === 'true') return
  // Commit the collapsed height before the transition exists, so the first paint does not animate.
  void block.getClientRects()
  block.setAttribute(MOTION_ATTR, 'true')
}

function onTransitionEnd(event: TransitionEvent): void {
  if (event.propertyName !== 'max-height') return
  const block = event.currentTarget
  if (!(block instanceof HTMLElement)) return
  if (block.getAttribute(STATE_ATTR) !== 'open') return
  block.style.maxHeight = 'none'
}

function onClick(event: MouseEvent): void {
  const toggle = toggleFrom(event.target)
  if (toggle === null) return
  const block = blockFromToggle(toggle)
  if (block === null) return
  setOpen(block, block.getAttribute(STATE_ATTR) !== 'open')
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.key !== 'Enter' && event.key !== ' ') return
  const toggle = toggleFrom(event.target)
  if (toggle === null) return
  const block = blockFromToggle(toggle)
  if (block === null) return
  event.preventDefault()
  setOpen(block, block.getAttribute(STATE_ATTR) !== 'open')
}

function setOpen(block: HTMLElement, open: boolean): void {
  const heading = headingIn(block)
  if (heading === null) return
  block.setAttribute(STATE_ATTR, open ? 'open' : 'closed')
  heading.setAttribute('aria-expanded', open ? 'true' : 'false')
  const collapsed = collapsedHeight(heading)
  const full = block.scrollHeight
  if (collapsed <= 0 || full <= 0) return
  if (block.getAttribute(MOTION_ATTR) !== 'true') block.setAttribute(MOTION_ATTR, 'true')
  if (!open) {
    block.style.maxHeight = pixels(full)
    void block.getClientRects()
    block.style.maxHeight = pixels(collapsed)
    return
  }
  block.style.maxHeight = pixels(full)
}

function pixels(value: number): string {
  return `${String(value)}px`
}

function ensureListening(): void {
  if (listening) return
  document.addEventListener('click', onClick)
  document.addEventListener('keydown', onKeyDown)
  listening = true
}

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID) !== null) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = PICKUP_CSS
  document.head.append(style)
}

function isPickupHeading(node: Element): node is HTMLElement {
  if (!(node instanceof HTMLElement)) return false
  return node.textContent.replace(/\s+/g, ' ').trim() === LABEL
}

function pickupBlock(heading: HTMLElement): HTMLElement | null {
  const block = heading.parentElement?.parentElement ?? null
  if (!(block instanceof HTMLElement)) return null
  if (!block.classList.contains('pl-3') || !block.classList.contains('text-primary-600'))
    return null
  return block
}

function headingIn(block: HTMLElement): HTMLElement | null {
  const heading = block.querySelector(`[${TOGGLE_ATTR}="true"]`)
  if (!(heading instanceof HTMLElement)) return null
  return heading
}

function blockFromToggle(toggle: HTMLElement): HTMLElement | null {
  const block = toggle.parentElement?.parentElement ?? null
  if (!(block instanceof HTMLElement) || !block.hasAttribute(STATE_ATTR)) return null
  return block
}

function toggleFrom(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null
  const toggle = target.closest(`[${TOGGLE_ATTR}="true"]`)
  if (!(toggle instanceof HTMLElement)) return null
  return toggle
}

function collapsedHeight(heading: HTMLElement): number {
  return Math.ceil(heading.getBoundingClientRect().height)
}

function normalizeLabel(heading: HTMLElement): void {
  for (const node of heading.childNodes) {
    if (node.nodeType !== Node.TEXT_NODE) continue
    const text = node.textContent
    if (text === null) continue
    if (text.replace(/\s+/g, ' ').trim() === LABEL) node.textContent = LABEL
  }
}

function restoreLabel(heading: HTMLElement): void {
  for (const node of heading.childNodes) {
    if (node.nodeType !== Node.TEXT_NODE) continue
    const text = node.textContent
    if (text === null) continue
    if (text.trim() === LABEL) node.textContent = ` ${LABEL} `
  }
}
