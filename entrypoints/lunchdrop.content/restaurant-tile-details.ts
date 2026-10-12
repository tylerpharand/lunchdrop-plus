import type { RestaurantTileDetails } from '../../lib/restaurant-tile-details'

const STYLE_ID = 'lunchbot-restaurant-tile-details'
const HIDDEN_ATTR = 'data-lunchbot-hidden-tile-detail'
const PLACED_ATTR = 'data-lunchbot-order-placed'
const BADGE_ATTR = 'data-lunchbot-order-badge'

const GRID = 'div.flex.flex-wrap.gap-3:has(> a [class*="w-[162px]"])'
const DETAIL = `${GRID} div.mt-2.text-center.text-gray-600`
const LOGO = `${GRID} [class*="w-[162px]"]`

// Lunchdrop's gap-3 is loose once the lines under the tiles are gone.
const TIGHT_GAP = '0.5rem'

const CHECK_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cpath fill='%23fff' d='M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0L369 209z'/%3E%3C/svg%3E"

// The logo's wrapper keeps Lunchdrop's bottom padding only while a line under it is still shown.
const ENHANCED_CSS = `
[${HIDDEN_ATTR}="true"] { display: none !important; }
${GRID} .pb-2:not(:has(> .mt-2:not([${HIDDEN_ATTR}="true"]))) {
  padding-bottom: 0;
}
${GRID} { gap: ${TIGHT_GAP}; }
${GRID} a > div.border-2.rounded-md {
  border-radius: 12px !important;
}
a:has([${PLACED_ATTR}="true"]) > div.border-2 {
  border-color: #009900 !important;
}
[${PLACED_ATTR}="true"] {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: flex-start !important;
  box-sizing: border-box !important;
  padding: 0 !important;
  overflow: hidden !important;
  border: none !important;
  background-color: #006400 !important;
  background-image: linear-gradient(to top, #009900 22px, #006400 22px) !important;
}
[${PLACED_ATTR}="true"] > img {
  flex: 1 1 auto !important;
  min-height: 0 !important;
  height: auto !important;
  width: auto !important;
  max-width: calc(100% - 12px) !important;
  max-height: calc(100% - 24px) !important;
  margin-top: auto !important;
  margin-bottom: auto !important;
  object-fit: contain !important;
}
[${BADGE_ATTR}="true"] {
  position: static !important;
  inset: auto !important;
  flex: 0 0 22px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 4px !important;
  box-sizing: border-box !important;
  width: 100% !important;
  height: 22px !important;
  margin: 0 !important;
  padding: 0 6px !important;
  background: transparent !important;
  color: #fff !important;
  font-size: 11px !important;
  font-weight: 700 !important;
  line-height: 1 !important;
  white-space: nowrap !important;
}
[${BADGE_ATTR}="true"]::before {
  content: "";
  width: 13px;
  height: 13px;
  flex: none;
  background: url("${CHECK_ICON}") center / contain no-repeat;
}
@media (min-width: 320px) and (max-width: 767px) {
  [${PLACED_ATTR}="true"] {
    background-image: linear-gradient(to top, #009900 18px, #006400 18px) !important;
  }
  [${PLACED_ATTR}="true"] > img {
    max-height: calc(100% - 20px) !important;
  }
  [${BADGE_ATTR}="true"] {
    flex-basis: 18px !important;
    height: 18px !important;
    gap: 3px !important;
    font-size: 10px !important;
  }
  [${BADGE_ATTR}="true"]::before {
    width: 11px;
    height: 11px;
  }
}
`

export function syncRestaurantTileDetails(details: RestaurantTileDetails): void {
  if (!details.enhanced) {
    removeRestaurantTileDetails()
    return
  }
  ensureStyles()
  const placed = new Set<HTMLElement>()
  for (const node of document.querySelectorAll(DETAIL)) {
    if (!(node instanceof HTMLElement)) continue
    if (isOrderPlaced(node)) {
      const logo = logoForDetail(node)
      if (logo !== null) placed.add(logo)
    }
    node.setAttribute(HIDDEN_ATTR, 'true')
  }
  for (const logo of document.querySelectorAll(LOGO)) {
    if (!(logo instanceof HTMLElement)) continue
    if (placed.has(logo)) ensureBadge(logo)
    else clearBadge(logo)
  }
}

export function removeRestaurantTileDetails(): void {
  document.getElementById(STYLE_ID)?.remove()
  for (const hidden of document.querySelectorAll(`[${HIDDEN_ATTR}="true"]`)) {
    hidden.removeAttribute(HIDDEN_ATTR)
  }
  for (const logo of document.querySelectorAll(`[${PLACED_ATTR}="true"]`)) {
    if (logo instanceof HTMLElement) clearBadge(logo)
  }
}

function ensureStyles(): void {
  const existing = document.getElementById(STYLE_ID)
  if (existing instanceof HTMLStyleElement) {
    if (existing.textContent !== ENHANCED_CSS) existing.textContent = ENHANCED_CSS
    return
  }
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = ENHANCED_CSS
  document.head.append(style)
}

function ensureBadge(logo: HTMLElement): void {
  logo.setAttribute(PLACED_ATTR, 'true')
  if (logo.querySelector(`[${BADGE_ATTR}]`) !== null) return
  const badge = document.createElement('span')
  badge.setAttribute(BADGE_ATTR, 'true')
  badge.textContent = 'Order Placed'
  logo.append(badge)
}

function clearBadge(logo: HTMLElement): void {
  logo.removeAttribute(PLACED_ATTR)
  logo.querySelector(`[${BADGE_ATTR}]`)?.remove()
}

function logoForDetail(node: HTMLElement): HTMLElement | null {
  const logo = node.closest('a')?.querySelector('[class*="w-[162px]"]')
  return logo instanceof HTMLElement ? logo : null
}

function isOrderPlaced(node: HTMLElement): boolean {
  const text = node.textContent.replace(/\s+/g, ' ').trim().toLowerCase()
  return text.includes('order placed')
}
