import { openSupportModal } from './open'

const STYLE_ID = 'lunchbot-wrench-style'
const ORIGINAL_LABEL = 'Help support us'
const SUPPORT_LABEL = ' Support: '

export function removeSupportRow(): void {
  document.getElementById(STYLE_ID)?.remove()
  for (const node of document.querySelectorAll(
    'button[data-lunchbot-wrench], span[data-lunchbot-support-badge]'
  )) {
    node.remove()
  }
}

export function injectSupportRow(): void {
  removeSupportRow()
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
    if (label instanceof HTMLElement) bindOpen(label, link)
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
