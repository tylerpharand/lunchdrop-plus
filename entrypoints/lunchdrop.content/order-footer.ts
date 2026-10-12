const STYLE_ID = 'lunchbot-order-footer'
const ROW_ATTR = 'data-lunchbot-order-footer'
const ROLE_ATTR = 'data-lunchbot-order-footer-role'
const ID_ATTR = 'data-lunchbot-order-footer-id'
const SLOT_ATTR = 'data-lunchbot-order-slot'
const UTENSILS_LABEL = 'Include utensils'
const CANCEL_LABEL = 'Cancel this order'

const FOOTER_CSS = `
[${ROW_ATTR}] {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 0.75rem !important;
  width: 100% !important;
  box-sizing: border-box !important;
  margin-top: 0.75rem !important;
}
[${ROW_ATTR}] > [${ROLE_ATTR}] {
  width: auto !important;
  max-width: 100% !important;
  flex: 0 1 auto !important;
}
[${ROW_ATTR}] > [${ROLE_ATTR}="cancel"] {
  margin: 0 !important;
  text-align: left !important;
}
[${ROW_ATTR}] > [${ROLE_ATTR}="utensils"] {
  margin: 0 0 0 auto !important;
  text-align: right !important;
}
[${SLOT_ATTR}] {
  display: none !important;
}
`

let nextFooterId = 0

export function syncOrderFooter(enabled: boolean): void {
  if (!enabled) {
    removeOrderFooter()
    return
  }
  ensureStyles()
  for (const order of document.querySelectorAll('.order')) {
    placeFooter(order)
  }
  for (const row of document.querySelectorAll(`[${ROW_ATTR}]`)) {
    if (row.closest('.order') === null) row.remove()
  }
}

export function removeOrderFooter(): void {
  document.getElementById(STYLE_ID)?.remove()
  for (const host of document.querySelectorAll(`[${ROLE_ATTR}]`)) {
    if (!(host instanceof HTMLElement)) continue
    restoreHost(host)
  }
  for (const marker of document.querySelectorAll(`[${SLOT_ATTR}]`)) marker.remove()
  for (const row of document.querySelectorAll(`[${ROW_ATTR}]`)) row.remove()
}

function placeFooter(order: Element): void {
  const cancel = cancelHost(order)
  const utensils = utensilsHost(order)
  if (cancel === null && utensils === null) {
    clearFooter(order)
    return
  }
  const hosts = [cancel, utensils].filter((host): host is HTMLElement => host !== null)
  const container = footerContainer(order, hosts)
  const row = ensureRow(container)
  syncRole(row, cancel, 'cancel')
  syncRole(row, utensils, 'utensils')
  if (container.lastElementChild !== row) container.append(row)
}

function footerContainer(order: Element, hosts: HTMLElement[]): Element {
  const parents: Element[] = []
  for (const host of hosts) {
    const parent = originParent(host, order)
    if (parent !== null) parents.push(parent)
  }
  const first = parents[0]
  if (first === undefined) return order
  let container = first
  for (const parent of parents.slice(1)) container = commonAncestor(container, parent, order)
  if (container.hasAttribute(ROW_ATTR)) return container.parentElement ?? order
  return container
}

function originParent(host: HTMLElement, order: Element): Element | null {
  const id = host.getAttribute(ID_ATTR)
  if (id !== null && id !== '') {
    const marker = order.querySelector(`[${SLOT_ATTR}="${id}"]`)
    const marked = marker?.parentElement ?? null
    if (marked !== null && order.contains(marked) && !marked.hasAttribute(ROW_ATTR)) return marked
  }
  const parent = host.parentElement
  if (parent === null || !order.contains(parent)) return null
  if (parent.hasAttribute(ROW_ATTR)) return parent.parentElement
  return parent
}

function commonAncestor(left: Element, right: Element, order: Element): Element {
  const seen = new Set<Element>()
  let node: Element | null = left
  while (node !== null) {
    seen.add(node)
    if (node === order) break
    node = node.parentElement
  }
  node = right
  while (node !== null) {
    if (seen.has(node)) return node
    if (node === order) break
    node = node.parentElement
  }
  return order
}

function syncRole(row: HTMLElement, host: HTMLElement | null, role: 'cancel' | 'utensils'): void {
  for (const current of row.querySelectorAll(`[${ROLE_ATTR}="${role}"]`)) {
    if (current !== host && current instanceof HTMLElement) restoreHost(current)
  }
  placeHost(host, row, role)
}

function placeHost(host: HTMLElement | null, row: HTMLElement, role: 'cancel' | 'utensils'): void {
  if (host === null || host.contains(row)) return
  host.setAttribute(ROLE_ATTR, role)
  if (host.parentElement === row) return
  const id = footerId(host)
  const existing = document.querySelector(`[${SLOT_ATTR}="${id}"]`)
  if (!(existing instanceof HTMLElement)) {
    const marker = document.createElement('span')
    marker.setAttribute(SLOT_ATTR, id)
    marker.hidden = true
    host.before(marker)
  }
  if (role === 'cancel') row.prepend(host)
  else row.append(host)
}

function clearFooter(order: Element): void {
  const row = order.querySelector(`[${ROW_ATTR}]`)
  if (!(row instanceof HTMLElement)) return
  for (const host of row.querySelectorAll(`[${ROLE_ATTR}]`)) {
    if (host instanceof HTMLElement) restoreHost(host)
  }
  row.remove()
}

function restoreHost(host: HTMLElement): void {
  const id = host.getAttribute(ID_ATTR)
  const marker = id === null ? null : document.querySelector(`[${SLOT_ATTR}="${id}"]`)
  if (marker instanceof HTMLElement) marker.before(host)
  host.removeAttribute(ROLE_ATTR)
  host.removeAttribute(ID_ATTR)
  marker?.remove()
}

function ensureRow(container: Element): HTMLElement {
  const existing = container.querySelector(`:scope > [${ROW_ATTR}]`)
  if (existing instanceof HTMLElement) return existing
  const order = container.closest('.order') ?? container
  const stray = order.querySelector(`[${ROW_ATTR}]`)
  if (stray instanceof HTMLElement) {
    container.append(stray)
    return stray
  }
  const row = document.createElement('div')
  row.setAttribute(ROW_ATTR, 'true')
  container.append(row)
  return row
}

function cancelHost(order: Element): HTMLElement | null {
  for (const link of order.querySelectorAll('a')) {
    if (!(link instanceof HTMLAnchorElement)) continue
    if (!includesLabel(link, CANCEL_LABEL)) continue
    return actionHost(link)
  }
  return null
}

function utensilsHost(order: Element): HTMLElement | null {
  let host: HTMLElement | null = null
  for (const node of order.querySelectorAll('*')) {
    if (!(node instanceof HTMLElement)) continue
    if (!isUtensilsLabel(node)) continue
    const widened = widenUtensils(node, order)
    if (host === null || widened.contains(host)) host = widened
  }
  if (host !== null) return host
  const walker = document.createTreeWalker(order, NodeFilter.SHOW_TEXT)
  let text: Node | null
  while ((text = walker.nextNode())) {
    if ((text.textContent ?? '').replace(/\s+/g, ' ').trim() !== UTENSILS_LABEL) continue
    const parent = text.parentElement
    if (!(parent instanceof HTMLElement) || parent === order) continue
    if (parent.closest(`[${ROW_ATTR}]`) !== null) continue
    if (parent.querySelector('a, .fa-cutlery, .fa-ban') !== null) continue
    return widenUtensils(parent, order)
  }
  return null
}

function isUtensilsLabel(el: HTMLElement): boolean {
  if (el.hasAttribute(ROW_ATTR) || el.closest(`[${ROW_ATTR}]`) !== null) {
    return el.getAttribute(ROLE_ATTR) === 'utensils'
  }
  if (!exactLabel(el, UTENSILS_LABEL)) return false
  if (el.querySelector('a, .fa-cutlery, .fa-ban') !== null) return false
  return true
}

function widenUtensils(el: HTMLElement, order: Element): HTMLElement {
  let host = el
  while (host.parentElement instanceof HTMLElement) {
    const parent = host.parentElement
    if (parent === order || parent.classList.contains('order') || parent.hasAttribute(ROW_ATTR))
      break
    if (parent.querySelector('a, .fa-cutlery, .fa-ban') !== null) break
    const text = normalizedText(parent)
    if (!text.includes(UTENSILS_LABEL)) break
    if (text.length > UTENSILS_LABEL.length + 12) break
    host = parent
  }
  return host
}

function actionHost(link: HTMLAnchorElement): HTMLElement {
  const parent = link.parentElement
  if (parent !== null && parent.tagName === 'P' && parent.childElementCount === 1) return parent
  return link
}

function footerId(host: HTMLElement): string {
  const existing = host.getAttribute(ID_ATTR)
  if (existing !== null && existing !== '') return existing
  nextFooterId += 1
  const id = String(nextFooterId)
  host.setAttribute(ID_ATTR, id)
  return id
}

function includesLabel(el: HTMLElement, label: string): boolean {
  return normalizedText(el).includes(label)
}

function exactLabel(el: HTMLElement, label: string): boolean {
  return normalizedText(el) === label
}

function normalizedText(el: HTMLElement): string {
  return el.textContent.replace(/\s+/g, ' ').trim()
}

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID) !== null) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = FOOTER_CSS
  document.head.append(style)
}
