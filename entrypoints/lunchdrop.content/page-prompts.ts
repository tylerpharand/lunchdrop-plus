import { hiddenPromptIds, pagePromptIdFromText, type HidePagePrompts } from '../../lib/page-prompts'

const STYLE_ID = 'lunchbot-page-prompts'
const HIDDEN_ATTR = 'data-lunchbot-hidden-prompt'

const PROMPT_CSS = `[${HIDDEN_ATTR}="true"] { display: none !important; }`

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
  }
}

function promptHost(banner: HTMLElement): HTMLElement {
  const parent = banner.parentElement
  if (parent !== null && parent.classList.contains('my-2') && parent.childElementCount === 1) {
    return parent
  }
  return banner
}
