import { hiddenPromptIds, pagePromptIdFromText, type HidePagePrompts } from '../../lib/page-prompts'

const STYLE_ID = 'lunchbot-page-prompts'
const HIDDEN_ATTR = 'data-lunchbot-hidden-prompt'
const ORDER_PLACED_ATTR = 'data-lunchbot-order-placed-banner'

const PROMPT_CSS = `
[${HIDDEN_ATTR}="true"] { display: none !important; }
[${ORDER_PLACED_ATTR}="true"] {
  border: 1px solid rgb(0 0 0 / 15%) !important;
  border-radius: 13px !important;
  padding: 10px !important;
  background: white !important;
  box-shadow: rgba(0, 0, 0, 0.1) 0px 2px 5px !important;
}
[${ORDER_PLACED_ATTR}="true"] > .flex {
  align-items: center !important;
  justify-content: center !important;
}
`

export function ensurePromptStyles(): void {
  if (document.getElementById(STYLE_ID) !== null) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = PROMPT_CSS
  document.head.append(style)
}

export function removePromptStyles(): void {
  document.getElementById(STYLE_ID)?.remove()
  for (const hidden of document.querySelectorAll(`[${HIDDEN_ATTR}="true"]`)) {
    hidden.removeAttribute(HIDDEN_ATTR)
  }
  for (const placed of document.querySelectorAll(`[${ORDER_PLACED_ATTR}="true"]`)) {
    placed.removeAttribute(ORDER_PLACED_ATTR)
  }
}

export function syncMiscPrompts(preference: HidePagePrompts): void {
  const hidden = hiddenPromptIds(preference)
  for (const banner of document.querySelectorAll('[class*="banner-component"]')) {
    if (!(banner instanceof HTMLElement)) continue
    const host = promptHost(banner)
    const promptId = pagePromptIdFromText(banner.textContent)
    if (promptId !== null && hidden.has(promptId)) {
      host.setAttribute(HIDDEN_ATTR, 'true')
      continue
    }
    if (host.getAttribute(HIDDEN_ATTR) === 'true') host.removeAttribute(HIDDEN_ATTR)
    if (banner.textContent.includes('Order placed at')) {
      banner.setAttribute(ORDER_PLACED_ATTR, 'true')
    } else if (banner.getAttribute(ORDER_PLACED_ATTR) === 'true') {
      banner.removeAttribute(ORDER_PLACED_ATTR)
    }
  }
}

function promptHost(banner: HTMLElement): HTMLElement {
  const parent = banner.parentElement
  if (parent !== null && parent.classList.contains('my-2') && parent.childElementCount === 1) {
    return parent
  }
  return banner
}
