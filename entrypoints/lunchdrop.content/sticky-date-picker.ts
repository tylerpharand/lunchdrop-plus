import markSource from '../../design/icon-inverse.svg?raw'

const STYLE_ID = 'lunchbot-sticky-date-picker'
const ROOT_ATTR = 'data-lunchbot-sticky-dates'
const TRIGGER_ATTR = 'data-lunchbot-menu-trigger'
const MARK_ATTR = 'data-lunchbot-menu-mark'
const HEADER_HIDDEN = 'data-lunchbot-header-hidden'

const DATE_BAR = 'div.bg-primary-600.text-xl:has(.day-container)'
const HEADER = '[data-menu-sticky-header]'
const DAYS = `${DATE_BAR} > div > .day-container`

// One size at every width. Lunchdrop's own classes jump from 2.5rem to 5rem.
const MENU_SIZE = '2rem'
const MENU_INSET = '1.5rem'
// Room between the menu icon and the days, on top of the inset from the edge.
const MENU_GAP = '0.5rem'
const LOGO_SIZE = '2.75rem'
const LOGO_INSET = '1rem'
const LOGO_ROTATION = '10deg'
// The fade stays clear across the outer half of each icon and turns solid at the days.
const LOGO_FADE_START = `calc(${LOGO_INSET} + ${LOGO_SIZE} / 2)`
const LOGO_FADE_END = `calc(${LOGO_INSET} + ${LOGO_SIZE})`
const MENU_FADE_START = `calc(${MENU_INSET} + ${MENU_SIZE} / 2)`
const MENU_FADE_END = `calc(${MENU_INSET} + ${MENU_SIZE} + ${MENU_GAP})`
// Lunchdrop's smaller layout runs through 767px. Scale the bar there so the
// type, padding, and height come down together. A stretched block stays full
// width under zoom, so the width is left alone.
const NARROW_MAX = '767px'
const NARROW_SCALE = '0.9'

const DAY_MASK = `linear-gradient(to right, transparent 0, transparent ${LOGO_FADE_START}, #000 ${LOGO_FADE_END}, #000 calc(100% - ${MENU_FADE_END}), transparent calc(100% - ${MENU_FADE_START}), transparent 100%)`

const STICKY_CSS = `
${HEADER}[${HEADER_HIDDEN}="true"] {
  display: none !important;
}
[${ROOT_ATTR}="true"] ${DATE_BAR} {
  position: sticky !important;
  top: 0 !important;
  z-index: 30 !important;
  box-sizing: border-box !important;
  border-bottom: 1px solid #00000020 !important;
}
[${ROOT_ATTR}="true"] ${DATE_BAR} > div {
  position: relative !important;
}
[${ROOT_ATTR}="true"] ${DAYS} {
  flex: 1 1 auto !important;
  min-width: 0 !important;
  padding-left: ${LOGO_FADE_END} !important;
  padding-right: ${MENU_FADE_END} !important;
  scroll-padding-left: ${LOGO_FADE_END} !important;
  scroll-padding-right: ${MENU_FADE_END} !important;
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
[${ROOT_ATTR}="true"] [${MARK_ATTR}="true"] {
  position: absolute !important;
  z-index: 2 !important;
  left: ${LOGO_INSET} !important;
  top: 50% !important;
  transform: translateY(-50%) rotate(${LOGO_ROTATION}) !important;
  display: flex !important;
  width: ${LOGO_SIZE} !important;
  height: ${LOGO_SIZE} !important;
  margin: 0 !important;
  cursor: default !important;
  pointer-events: auto !important;
  user-select: none !important;
}
[${ROOT_ATTR}="true"] [${MARK_ATTR}="true"] svg {
  display: block !important;
  width: 100% !important;
  height: 100% !important;
  pointer-events: none !important;
}
svg[${TRIGGER_ATTR}="true"] {
  position: absolute !important;
  z-index: 2 !important;
  right: ${MENU_INSET} !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  width: ${MENU_SIZE} !important;
  height: ${MENU_SIZE} !important;
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
    removeMark()
    return
  }
  const icon = liveIcon(row)
  if (icon === null) {
    clearFlags()
    removeMark()
    return
  }
  rememberHome(icon)
  const days = row.querySelector(':scope > .day-container')
  if (icon.parentElement !== row || icon.nextElementSibling !== days) row.insertBefore(icon, days)
  icon.setAttribute(TRIGGER_ATTR, 'true')
  held = icon
  document.documentElement.setAttribute(ROOT_ATTR, 'true')
  document.querySelector(HEADER)?.setAttribute(HEADER_HIDDEN, 'true')
  ensureMark(row)
}

export function removeStickyDatePicker(): void {
  restoreTrigger()
  clearFlags()
  removeMark()
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

function ensureMark(row: HTMLElement): void {
  const existing = document.querySelector(`[${MARK_ATTR}]`)
  if (existing !== null && existing.parentElement !== row) existing.remove()
  if (row.querySelector(`:scope > [${MARK_ATTR}]`) !== null) return
  const mark = menuMark()
  if (mark === null) return
  row.insertBefore(mark, row.firstChild)
}

function menuMark(): HTMLElement | null {
  const parsed = new DOMParser().parseFromString(markSource, 'image/svg+xml')
  if (parsed.querySelector('parsererror') !== null) return null
  const svg = parsed.querySelector('svg')
  const path = parsed.querySelector('path')
  if (svg === null || path === null) return null
  svg.querySelector('defs')?.remove()
  svg.removeAttribute('id')
  svg.removeAttribute('width')
  svg.removeAttribute('height')
  path.setAttribute('fill', '#fefefe')
  path.removeAttribute('class')
  const mark = document.createElement('span')
  mark.setAttribute(MARK_ATTR, 'true')
  mark.setAttribute('aria-hidden', 'true')
  mark.append(document.importNode(svg, true))
  const stop = (event: Event): void => {
    event.preventDefault()
    event.stopPropagation()
  }
  mark.addEventListener('pointerdown', stop)
  mark.addEventListener('mousedown', stop)
  mark.addEventListener('click', stop)
  mark.addEventListener('auxclick', stop)
  return mark
}

function removeMark(): void {
  document.querySelector(`[${MARK_ATTR}]`)?.remove()
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
