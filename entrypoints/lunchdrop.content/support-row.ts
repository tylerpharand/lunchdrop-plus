import {
  formatDollars,
  LUNCHBOT_SOURCE,
  orderSupportFromMessage,
  supportAmountOverridden,
  supportOverrideMarks,
  type SupportOverrideMarks,
} from '../../lib/support-policy'
import { readSupportOrigins } from '../../lib/support-policy-storage'
import { openSupportModal } from './open'

const STYLE_ID = 'lunchbot-support-override-style'
const LEGACY_STYLE_IDS = ['lunchbot-support-mark-style', 'lunchbot-wrench-style']
const ORIGINAL_LABEL = 'Help support us'
const SUPPORT_LABEL = ' Support: '
const REFRESH_MS = 50

const OVERRIDE_CSS = `
  [data-lunchbot-support-overridden="true"] {
    font-weight: 700;
    font-style: italic;
  }
`

let marks: SupportOverrideMarks = {
  amounts: new Set(),
  precise: new Set(),
  blocked: new Set(),
}
let generation = 0
let refreshTimer: number | null = null

export function startSupportOverrideMarks(): () => void {
  const onMessage = (event: MessageEvent): void => {
    if (event.source !== window) return
    const context = orderSupportFromMessage(event.data)
    if (context === undefined) return
    const current = ++generation
    void readSupportOrigins().then(origins => {
      if (current !== generation) return
      marks = supportOverrideMarks(context.orders, origins)
      injectSupportRow()
    })
  }
  window.addEventListener('message', onMessage)
  const retries = [
    window.setTimeout(refreshSupportOverrideMarks, 400),
    window.setTimeout(refreshSupportOverrideMarks, 1200),
  ]
  refreshSupportOverrideMarks()
  return () => {
    window.removeEventListener('message', onMessage)
    if (refreshTimer !== null) window.clearTimeout(refreshTimer)
    for (const timer of retries) window.clearTimeout(timer)
  }
}

export function refreshSupportOverrideMarks(): void {
  if (refreshTimer !== null) window.clearTimeout(refreshTimer)
  refreshTimer = window.setTimeout(() => {
    refreshTimer = null
    window.postMessage(
      { source: LUNCHBOT_SOURCE, type: 'request-subsidy-context' },
      window.location.origin
    )
  }, REFRESH_MS)
}

export function removeSupportRow(): void {
  document.getElementById(STYLE_ID)?.remove()
  for (const id of LEGACY_STYLE_IDS) document.getElementById(id)?.remove()
  for (const node of document.querySelectorAll(
    'button[data-lunchbot-wrench], span[data-lunchbot-support-badge]'
  )) {
    node.remove()
  }
  for (const link of document.querySelectorAll('a[data-lunchbot-support-overridden="true"]')) {
    if (!(link instanceof HTMLAnchorElement)) continue
    link.removeAttribute('aria-label')
    delete link.dataset['lunchbotSupportOverridden']
  }
  for (const label of document.querySelectorAll('[data-lunchbot-support-overridden="true"]')) {
    if (!(label instanceof HTMLElement)) continue
    delete label.dataset['lunchbotSupportOverridden']
  }
}

export function injectSupportRow(): void {
  ensureOverrideStyle()
  clearLegacyBadges()
  for (const row of supportRows()) {
    if (row.dataset['lunchbotSupportRow'] !== 'true') row.dataset['lunchbotSupportRow'] = 'true'
    rewriteSupportLabel(row)
    const link = amountLink(row)
    if (link === null) continue
    const cell = link.parentElement
    if (cell instanceof HTMLTableCellElement && cell.style.whiteSpace !== 'nowrap') {
      cell.style.whiteSpace = 'nowrap'
    }
    bindOpen(link, link)
    const label = row.querySelector('div.cursor-pointer')
    if (label instanceof HTMLElement) {
      bindOpen(label, link)
      delete label.dataset['lunchbotSupportOverridden']
    }
    syncOverridePrice(link, dollarLabel(link.textContent), amountDueLabel(row))
  }
}

function supportRows(): HTMLTableRowElement[] {
  const rows: HTMLTableRowElement[] = []
  for (const link of document.querySelectorAll('a.border-dashed')) {
    if (!(link instanceof HTMLAnchorElement) || !link.textContent.includes('$')) continue
    const row = link.closest('tr')
    if (!(row instanceof HTMLTableRowElement)) continue
    const text = row.textContent
    if (!text.includes(ORIGINAL_LABEL) && row.dataset['lunchbotSupportRow'] !== 'true') continue
    if (!text.includes('Support:') && !text.includes(ORIGINAL_LABEL)) continue
    rows.push(row)
  }
  return rows
}

function amountLink(row: HTMLTableRowElement): HTMLAnchorElement | null {
  const link = row.querySelector('a.border-dashed')
  if (!(link instanceof HTMLAnchorElement) || !link.textContent.includes('$')) return null
  return link
}

function rewriteSupportLabel(row: HTMLTableRowElement): void {
  const label = row.querySelector('div.cursor-pointer')
  if (label === null) return
  for (const node of label.childNodes) {
    if (node.nodeType !== Node.TEXT_NODE || !node.textContent?.includes(ORIGINAL_LABEL)) continue
    node.textContent = SUPPORT_LABEL
  }
}

function syncOverridePrice(
  link: HTMLAnchorElement,
  supportAmount: string | null,
  amountDue: string | null
): void {
  const overridden =
    supportAmount !== null && supportAmountOverridden(marks, supportAmount, amountDue)
  if (overridden) {
    link.dataset['lunchbotSupportOverridden'] = 'true'
    return
  }
  delete link.dataset['lunchbotSupportOverridden']
}

function amountDueLabel(row: HTMLTableRowElement): string | null {
  const table = row.closest('table')
  if (table === null) return null
  const match = /Amount Due:\s*(\$\d+(?:\.\d+)?)/.exec(table.textContent)
  const raw = match?.[1]
  if (raw === undefined) return null
  return dollarLabel(raw)
}

function dollarLabel(value: string): string | null {
  const match = /\$(\d+(?:\.\d+)?)/.exec(value.trim())
  const raw = match?.[1]
  if (raw === undefined) return null
  const amount = Number(raw)
  if (!Number.isFinite(amount)) return null
  return formatDollars(amount)
}

function ensureOverrideStyle(): void {
  if (document.getElementById(STYLE_ID) !== null) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = OVERRIDE_CSS
  document.head.append(style)
}

function clearLegacyBadges(): void {
  for (const node of document.querySelectorAll(
    'button[data-lunchbot-wrench], span[data-lunchbot-support-badge]'
  )) {
    node.remove()
  }
  for (const link of document.querySelectorAll('a[aria-label$="set by Lunchdrop+"]')) {
    if (!(link instanceof HTMLAnchorElement)) continue
    link.removeAttribute('aria-label')
  }
}

function bindOpen(element: HTMLElement, link: HTMLAnchorElement): void {
  if (element.dataset['lunchbotSupportOpen'] === 'true') return
  element.dataset['lunchbotSupportOpen'] = 'true'
  element.addEventListener(
    'click',
    event => {
      event.preventDefault()
      event.stopImmediatePropagation()
      openSupportModal(link.textContent)
    },
    true
  )
}
