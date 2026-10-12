const STYLE_ID = 'lunchbot-wrap-descriptions'

const WRAP_CSS = `
.menu .items .item .item-text {
  max-width: 100%;
}
.menu .items .item .item-description,
.cart .cart-body .item-name + .text-muted.small,
.main-preview-menu .text-gray-500 {
  overflow-wrap: anywhere;
}
`

export function syncWrapLongDescriptions(enabled: boolean): void {
  if (!enabled) {
    document.getElementById(STYLE_ID)?.remove()
    return
  }
  if (document.getElementById(STYLE_ID) !== null) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = WRAP_CSS
  document.head.append(style)
}

export function removeWrapLongDescriptions(): void {
  document.getElementById(STYLE_ID)?.remove()
}
