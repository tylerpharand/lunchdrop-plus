const STYLE_ID = 'lunchbot-new-badges'
const HIDDEN_ATTR = 'data-lunchbot-hidden-new-badge'

const NEW_BADGE =
  'div.absolute.rounded-full.uppercase.font-bold.bg-primary-600[class*="-top-2"][class*="-left-2"][class*="w-10"][class*="h-10"]'

const HIDDEN_CSS = `[${HIDDEN_ATTR}="true"] { display: none !important; }`

export function syncHideNewBadges(enabled: boolean): void {
  if (!enabled) {
    removeHideNewBadges()
    return
  }
  ensureStyles()
  for (const node of document.querySelectorAll(NEW_BADGE)) {
    if (!(node instanceof HTMLElement)) continue
    const text = node.textContent.replace(/\s+/g, ' ').trim().toLowerCase()
    if (text === 'new') node.setAttribute(HIDDEN_ATTR, 'true')
    else if (node.getAttribute(HIDDEN_ATTR) === 'true') node.removeAttribute(HIDDEN_ATTR)
  }
}

export function removeHideNewBadges(): void {
  document.getElementById(STYLE_ID)?.remove()
  for (const hidden of document.querySelectorAll(`[${HIDDEN_ATTR}="true"]`)) {
    hidden.removeAttribute(HIDDEN_ATTR)
  }
}

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID) !== null) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = HIDDEN_CSS
  document.head.append(style)
}
