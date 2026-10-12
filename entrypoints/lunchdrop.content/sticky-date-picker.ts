const STYLE_ID = 'lunchbot-sticky-date-picker'
const ROOT_ATTR = 'data-lunchbot-sticky-dates'
const TRIGGER_ATTR = 'data-lunchbot-menu-trigger'
const HEADER_HIDDEN = 'data-lunchbot-header-hidden'

const DATE_BAR = 'div.bg-primary-600.text-xl:has(.day-container)'
const HEADER = '[data-menu-sticky-header]'
const DAYS = `${DATE_BAR} > div > .day-container`

// One size at every width. Lunchdrop's own classes jump from 2.5rem to 5rem.
const ICON_SIZE = '2rem'
// The icon covers this much of the scroller. The fade reaches solid just past it.
const ICON_COVER = '2rem'
const FADE_END = '3rem'
const EDGE_FADE = '1.5rem'
// Lunchdrop's smaller layout runs through 767px. Scale the bar there so the
// type, padding, and height come down together. A stretched block stays full
// width under zoom, so the width is left alone.
const NARROW_MAX = '767px'
const NARROW_SCALE = '0.9'
// A step darker than the accent green (#009900).
const BAR_EDGE = '#007a00'

const DAY_MASK = `linear-gradient(to right, transparent 0, transparent ${ICON_COVER}, #000 ${FADE_END}, #000 calc(100% - ${EDGE_FADE}), transparent 100%)`

const STICKY_CSS = `
${HEADER}[${HEADER_HIDDEN}="true"] {
  display: none !important;
}
[${ROOT_ATTR}="true"] ${DATE_BAR} {
  position: sticky !important;
  top: 0 !important;
  z-index: 30 !important;
  box-sizing: border-box !important;
  border-bottom: 2px solid ${BAR_EDGE} !important;
}
[${ROOT_ATTR}="true"] ${DATE_BAR} > div {
  position: relative !important;
}
[${ROOT_ATTR}="true"] ${DAYS} {
  flex: 1 1 auto !important;
  min-width: 0 !important;
  padding-left: ${FADE_END} !important;
  padding-right: ${EDGE_FADE} !important;
  scroll-padding-left: ${FADE_END} !important;
  scroll-padding-right: ${EDGE_FADE} !important;
  overflow-x: auto !important;
  overflow-y: hidden !important;
  overscroll-behavior-y: none !important;
  touch-action: pan-x !important;
  -webkit-mask-image: ${DAY_MASK};
  mask-image: ${DAY_MASK};
}
[${ROOT_ATTR}="true"] ${DAYS} > a {
  scroll-margin-left: 0 !important;
  scroll-margin-right: 0 !important;
}
[${ROOT_ATTR}="true"] ${DAYS} > a.bg-white {
  background: linear-gradient(to bottom, rgb(255 255 255 / 0.25), rgb(255 255 255 / 0.15)) !important;
  color: #fff !important;
  border: 3px solid rgb(255 255 255 / 0.6) !important;
}
[${ROOT_ATTR}="true"] ${DAYS} > a.bg-white:hover {
  background: linear-gradient(to bottom, rgb(255 255 255 / 0.25), rgb(255 255 255 / 0.15)) !important;
  color: #fff !important;
}
[${ROOT_ATTR}="true"] ${DAYS} > a.bg-white * {
  color: #fff !important;
}
svg[${TRIGGER_ATTR}="true"] {
  position: absolute !important;
  z-index: 2 !important;
  left: 1rem !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  width: ${ICON_SIZE} !important;
  height: ${ICON_SIZE} !important;
  margin: 0 !important;
  flex: none !important;
  color: #fff !important;
}
[${ROOT_ATTR}="true"] ${DATE_BAR} > div > div:has(svg[data-icon="calendar"]) {
  display: none !important;
}
@media (max-width: ${NARROW_MAX}) {
  [${ROOT_ATTR}="true"] ${DATE_BAR} {
    zoom: ${NARROW_SCALE};
  }
}
`

let held: SVGElement | null = null
let home: HTMLElement | null = null

export function syncStickyDatePicker(enabled: boolean): void {
  if (!enabled) {
    removeStickyDatePicker()
    return
  }
  ensureStyles()
  const row = dateBarRow()
  if (row === null) {
    restoreTrigger()
    clearFlags()
    return
  }
  const icon = liveIcon(row)
  if (icon === null) {
    clearFlags()
    return
  }
  rememberHome(icon)
  const days = row.querySelector(':scope > .day-container')
  if (icon.parentElement !== row || icon.nextElementSibling !== days) row.insertBefore(icon, days)
  icon.setAttribute(TRIGGER_ATTR, 'true')
  held = icon
  document.documentElement.setAttribute(ROOT_ATTR, 'true')
  document.querySelector(HEADER)?.setAttribute(HEADER_HIDDEN, 'true')
}

export function removeStickyDatePicker(): void {
  restoreTrigger()
  clearFlags()
  document.getElementById(STYLE_ID)?.remove()
}

function liveIcon(row: HTMLElement): SVGElement | null {
  const inHeader = iconIn(document.querySelector(HEADER))
  if (inHeader !== null) {
    const inRow = iconIn(row)
    if (inRow !== null && inRow !== inHeader) inRow.remove()
    return inHeader
  }
  const inRow = iconIn(row)
  if (inRow !== null) return inRow
  if (held !== null && !held.isConnected) return held
  return null
}

function rememberHome(icon: SVGElement): void {
  if (home?.isConnected === true) return
  const parent = icon.parentElement
  if (parent !== null && parent.closest(HEADER) !== null) home = parent
}

function restoreTrigger(): void {
  const icon = held ?? markedIcon()
  const inHeader = iconIn(document.querySelector(HEADER))
  if (inHeader !== null) {
    if (icon !== null && icon !== inHeader) icon.remove()
  } else if (icon !== null) {
    const slot = home?.isConnected === true ? home : menuSlot()
    if (slot !== null) slot.appendChild(icon)
  }
  icon?.removeAttribute(TRIGGER_ATTR)
  if (inHeader !== null) inHeader.removeAttribute(TRIGGER_ATTR)
  held = null
  home = null
}

function clearFlags(): void {
  document.documentElement.removeAttribute(ROOT_ATTR)
  document.querySelector(HEADER)?.removeAttribute(HEADER_HIDDEN)
}

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID) !== null) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = STICKY_CSS
  document.head.append(style)
}

function dateBarRow(): HTMLElement | null {
  const row = document.querySelector(`${DATE_BAR} > div`)
  return row instanceof HTMLElement ? row : null
}

function menuSlot(): HTMLElement | null {
  const slot = document.querySelector(`${HEADER} .flex.select-none`)
  return slot instanceof HTMLElement ? slot : null
}

function iconIn(root: Element | null): SVGElement | null {
  const icon = root?.querySelector('svg[data-icon="bars"]')
  return icon instanceof SVGElement ? icon : null
}

function markedIcon(): SVGElement | null {
  const icon = document.querySelector(`svg[${TRIGGER_ATTR}="true"]`)
  return icon instanceof SVGElement ? icon : null
}
