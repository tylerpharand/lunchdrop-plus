const STYLE_ID = 'lunchbot-hide-tooltips'

// Lunchdrop's tooltip is the absolute card inside a relative wrapper. The daily
// discount line opens it on hover, and a tap does the same on a phone.
const HIDDEN_CSS = `
div.relative > div.absolute.z-20.shadow-md[class*="w-[350px]"] {
  display: none !important;
}
`

export function syncHideTooltips(enabled: boolean): void {
  if (!enabled) {
    removeHideTooltips()
    return
  }
  if (document.getElementById(STYLE_ID) !== null) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = HIDDEN_CSS
  document.head.append(style)
}

export function removeHideTooltips(): void {
  document.getElementById(STYLE_ID)?.remove()
}
