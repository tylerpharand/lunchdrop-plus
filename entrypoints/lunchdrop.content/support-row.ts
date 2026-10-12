import { browser } from 'wxt/browser'
import {
  formatDollars,
  LUNCHBOT_SOURCE,
  orderSupportFromMessage,
  supportAmountOverridden,
  supportOverrideMarks,
  type OrderChoiceMemory,
  type OrderSupportChoice,
  type SupportOverrideMarks,
} from '../../lib/support-policy'
import {
  ORDER_CHOICE_KEY,
  readOrderChoices,
  readSupportOrigins,
} from '../../lib/support-policy-storage'
import { openSupportModal } from './open'

const STYLE_ID = 'lunchbot-support-override-style'
const LEGACY_STYLE_IDS = ['lunchbot-support-mark-style', 'lunchbot-wrench-style']
const ORIGINAL_LABEL = 'Help support us'
const SUPPORT_LABEL = ' Support: '
const REFRESH_MS = 50

const BOLT_MARK = 'lunchbotSupportBolt'

const OVERRIDE_CSS = `
  [data-lunchbot-support-overridden="true"] {
    font-weight: 700;
    font-style: italic;
  }

  svg[data-lunchbot-support-bolt] {
    display: inline-block;
    width: 0.85em;
    height: 0.85em;
    margin-right: 0.16em;
    vertical-align: -0.1em;
    cursor: pointer;
    fill: #009900;
  }

  svg[data-lunchbot-support-bolt] path {
    fill: #009900;
  }
`

let marks: SupportOverrideMarks = {
  amounts: new Set(),
  precise: new Set(),
  blocked: new Set(),
}
let generation = 0
let refreshTimer: number | null = null
let liveSupportChoice: { orderId: string; choice: OrderSupportChoice } | null = null

/** The open modal's choice. Cleared when the modal closes so the saved choice applies. */
export function setLiveSupportChoice(
  orderId: string | null,
  choice: OrderSupportChoice | null
): void {
  const next = orderId !== null && choice !== null ? { orderId, choice } : null
  if (liveSupportChoice?.orderId === next?.orderId && liveSupportChoice?.choice === next?.choice) {
    return
  }
  liveSupportChoice = next
  refreshSupportOverrideMarks()
}

export function startSupportOverrideMarks(): () => void {
  const onMessage = (event: MessageEvent): void => {
    if (event.source !== window) return
    const context = orderSupportFromMessage(event.data)
    if (context === undefined) return
    const current = ++generation
    void Promise.all([readSupportOrigins(), readOrderChoices()]).then(([origins, choices]) => {
      if (current !== generation) return
      marks = supportOverrideMarks(context.orders, origins, customOrderIds(choices))
      injectSupportRow()
    })
  }
  const onChoiceStored = (changes: Record<string, { newValue?: unknown }>): void => {
    if (changes[ORDER_CHOICE_KEY] === undefined) return
    refreshSupportOverrideMarks()
  }
  window.addEventListener('message', onMessage)
  browser.storage.onChanged.addListener(onChoiceStored)
  const retries = [
    window.setTimeout(refreshSupportOverrideMarks, 400),
    window.setTimeout(refreshSupportOverrideMarks, 1200),
  ]
  refreshSupportOverrideMarks()
  return () => {
    window.removeEventListener('message', onMessage)
    browser.storage.onChanged.removeListener(onChoiceStored)
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
  for (const bolt of document.querySelectorAll('svg[data-lunchbot-support-bolt]')) bolt.remove()
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
  removeLooseBolts()
}

function customOrderIds(choices: Readonly<Record<string, OrderChoiceMemory>>): Set<string> {
  const ids = new Set<string>()
  for (const [orderId, memory] of Object.entries(choices)) {
    if (memory.choice === 'custom') ids.add(orderId)
  }
  if (liveSupportChoice === null) return ids
  if (liveSupportChoice.choice === 'custom') ids.add(liveSupportChoice.orderId)
  else ids.delete(liveSupportChoice.orderId)
  return ids
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
  } else {
    delete link.dataset['lunchbotSupportOverridden']
  }
  syncOverrideBolt(link, overridden)
}

function syncOverrideBolt(link: HTMLAnchorElement, overridden: boolean): void {
  const bolt = boltBeside(link)
  if (!overridden) {
    bolt?.remove()
    return
  }
  if (bolt !== null) return
  const next = supportBolt()
  link.before(next)
  bindOpen(next, link)
}

function boltBeside(link: HTMLAnchorElement): SVGSVGElement | null {
  const previous = link.previousElementSibling
  if (!(previous instanceof SVGSVGElement)) return null
  if (previous.dataset[BOLT_MARK] !== 'true') return null
  return previous
}

function removeLooseBolts(): void {
  for (const node of document.querySelectorAll('svg[data-lunchbot-support-bolt]')) {
    const next = node.nextElementSibling
    if (next instanceof HTMLAnchorElement && next.dataset['lunchbotSupportOverridden'] === 'true') {
      continue
    }
    node.remove()
  }
}

function supportBolt(): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('aria-hidden', 'true')
  svg.dataset[BOLT_MARK] = 'true'
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('fill', '#009900')
  path.setAttribute('fill-rule', 'evenodd')
  path.setAttribute('clip-rule', 'evenodd')
  path.setAttribute(
    'd',
    'M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z'
  )
  svg.append(path)
  return svg
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

function bindOpen(element: HTMLElement | SVGElement, link: HTMLAnchorElement): void {
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
