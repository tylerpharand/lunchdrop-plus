const STYLE_ID = 'lunchbot-even-restaurant-cards'

const GRID = 'div.flex.flex-wrap.gap-3:has(> a [class*="w-[162px]"])'
const TILE = `${GRID} [class*="w-[162px]"]`

// Lunchdrop's `sm:` logo size applies from 320px through 767px. Wider and narrower
// viewports use the larger tile. The column minimum is that tile plus the card chrome,
// so a row grows into leftover space and never shrinks a card.
const EVEN_CSS = `
${GRID} {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(176px, 1fr));
}
${GRID} > a {
  min-width: 0;
}
${TILE} {
  width: 100%;
  height: auto;
  max-width: none;
  aspect-ratio: 162 / 102;
}
@media (min-width: 320px) and (max-width: 767px) {
  ${GRID} {
    grid-template-columns: repeat(auto-fill, minmax(146px, 1fr));
  }
  ${TILE} {
    aspect-ratio: 132 / 84;
  }
}
`

export function syncEvenRestaurantCards(enabled: boolean): void {
  if (!enabled) {
    document.getElementById(STYLE_ID)?.remove()
    return
  }
  if (document.getElementById(STYLE_ID) !== null) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = EVEN_CSS
  document.head.append(style)
}

export function removeEvenRestaurantCards(): void {
  document.getElementById(STYLE_ID)?.remove()
}
