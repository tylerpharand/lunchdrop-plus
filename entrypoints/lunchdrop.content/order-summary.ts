import {
  hiddenOrderActionIds,
  orderActionIdFromText,
  type HideOrderSummary,
} from '../../lib/order-summary'

const STYLE_ID = 'lunchbot-order-summary'
const HIDDEN_ATTR = 'data-lunchbot-hidden-order-action'

const ACTION_CSS = `[${HIDDEN_ATTR}="true"] { display: none !important; }`

export function ensureOrderSummaryStyles(): void {
  if (document.getElementById(STYLE_ID) !== null) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = ACTION_CSS
  document.head.append(style)
}

export function removeOrderSummaryStyles(): void {
  document.getElementById(STYLE_ID)?.remove()
  for (const hidden of document.querySelectorAll(`[${HIDDEN_ATTR}="true"]`)) {
    hidden.removeAttribute(HIDDEN_ATTR)
  }
}

export function syncOrderSummary(preference: HideOrderSummary): void {
  const hidden = hiddenOrderActionIds(preference)
  for (const link of document.querySelectorAll('.order a')) {
    if (!(link instanceof HTMLAnchorElement)) continue
    const actionId = orderActionIdFromText(link.textContent)
    const host = actionHost(link)
    if (actionId !== null && hidden.has(actionId)) {
      host.setAttribute(HIDDEN_ATTR, 'true')
      continue
    }
    if (host.getAttribute(HIDDEN_ATTR) === 'true') host.removeAttribute(HIDDEN_ATTR)
  }
  const hideInfo = hidden.has('info-icons')
  for (const icon of document.querySelectorAll('.order tr svg[data-icon="circle-info"]')) {
    if (hideInfo) {
      icon.setAttribute(HIDDEN_ATTR, 'true')
      continue
    }
    if (icon.getAttribute(HIDDEN_ATTR) === 'true') icon.removeAttribute(HIDDEN_ATTR)
  }
}

function actionHost(link: HTMLAnchorElement): HTMLElement {
  const parent = link.parentElement
  if (parent !== null && parent.tagName === 'P' && parent.childElementCount === 1) {
    return parent
  }
  return link
}
