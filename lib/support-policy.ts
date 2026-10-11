export const LUNCHBOT_SOURCE = 'lunchdrop-plus'

export const MAX_SUPPORT_PERCENT = 30

export const SUPPORT_PERCENT_CHOICES = [5, 10, 15, 20] as const

export interface SupportPolicy {
  mode: 'default' | 'percent' | 'remaining' | 'skip'
  percent: number
}

/** Choices on an open order. Custom is a dollar amount for that order only. */
export type OrderSupportChoice = 'custom' | 'percent' | 'remaining' | 'skip'

export type SupportChoiceMode = SupportPolicy['mode'] | 'custom'

export interface SubsidySnapshot {
  cap: number
  remaining: number
}

export interface OrderSupportContext {
  orders: PlacedOrder[]
  subsidy: SubsidySnapshot | null
}

export interface SupportQuote {
  itemsSubtotal: number
  baselineFee: number | null
  /** False until we've checked whether this order's original fee was saved. */
  baselineKnown: boolean
  subsidy: SubsidySnapshot | null
}

export interface ApplySupportRequest {
  requestId: string
  orderId: string
  deliveryId: string
  supportFee: number
}

export interface SupportFeeResult {
  requestId: string
  ok: boolean
  supportFee: number | null
  amountDue: number | null
  tax: number | null
}

export interface PolicyRequestMessage {
  source: typeof LUNCHBOT_SOURCE
  type: 'request-support-policy'
}

export interface PlacedOrder {
  id: string
  deliveryId?: string
  supportFee: number
  amountDue: number
  tax: number
  itemsSubtotal: number
  subsidy: number
  isSupportFeeEditable?: boolean
  isSubsidySupportFeeFixed?: boolean
}

export function defaultSupportPolicy(): SupportPolicy {
  return { mode: 'default', percent: 10 }
}

export function parseSupportPolicy(value: unknown): SupportPolicy {
  const base = defaultSupportPolicy()
  if (!isRecord(value)) return base
  const parsedPercent = readPercent(field(value, 'percent'))
  const mode = field(value, 'mode')
  if (mode === 'skip' || mode === 'none' || (mode === 'percent' && parsedPercent === 0)) {
    return { mode: 'skip', percent: base.percent }
  }
  const percent = nearestSupportPercent(
    parsedPercent === null || parsedPercent < 1 ? base.percent : parsedPercent
  )
  if (mode === 'remaining') return { mode: 'remaining', percent }
  if (mode === 'percent') return { mode: 'percent', percent }
  return { mode: 'default', percent }
}

export function policyFromMessage(value: unknown): SupportPolicy | null {
  if (!isRecord(value)) return null
  if (field(value, 'source') !== LUNCHBOT_SOURCE || field(value, 'type') !== 'support-policy') {
    return null
  }
  return parseSupportPolicy(field(value, 'policy'))
}

export function isPolicyRequestMessage(value: unknown): value is PolicyRequestMessage {
  if (!isRecord(value)) return false
  return (
    field(value, 'source') === LUNCHBOT_SOURCE && field(value, 'type') === 'request-support-policy'
  )
}

export function isSubsidyRequestMessage(value: unknown): boolean {
  if (!isRecord(value)) return false
  return (
    field(value, 'source') === LUNCHBOT_SOURCE && field(value, 'type') === 'request-subsidy-context'
  )
}

/** `undefined` when the message is something else. `null` when the day has no cap. */
export function subsidySnapshotFromMessage(value: unknown): SubsidySnapshot | null | undefined {
  if (!isRecord(value)) return undefined
  if (field(value, 'source') !== LUNCHBOT_SOURCE || field(value, 'type') !== 'subsidy-context') {
    return undefined
  }
  return readSubsidySnapshot(value)
}

/** `undefined` when the message is something else. */
export function orderSupportFromMessage(value: unknown): OrderSupportContext | undefined {
  if (!isRecord(value)) return undefined
  if (field(value, 'source') !== LUNCHBOT_SOURCE || field(value, 'type') !== 'subsidy-context') {
    return undefined
  }
  const orders: PlacedOrder[] = []
  const rawOrders = field(value, 'orders')
  if (Array.isArray(rawOrders)) {
    for (const item of rawOrders) {
      const order = parsePlacedOrder(item)
      if (order?.deliveryId === undefined) continue
      orders.push(order)
    }
  }
  return { orders, subsidy: readSubsidySnapshot(value) }
}

export interface SupportOrigin {
  orderId: string
  supportFee: number
}

/** Lunchdrop's fee from the place-order response, before we replace it. */
export function supportOriginFromMessage(value: unknown): SupportOrigin | null {
  if (!isRecord(value)) return null
  if (field(value, 'source') !== LUNCHBOT_SOURCE || field(value, 'type') !== 'support-origin') {
    return null
  }
  const orderId = field(value, 'orderId')
  const supportFee = readMoney(field(value, 'supportFee'))
  if (typeof orderId !== 'string' || supportFee === null) return null
  return { orderId, supportFee }
}

export function publishSupportOrigin(orderId: string, supportFee: number): void {
  window.postMessage(
    { source: LUNCHBOT_SOURCE, type: 'support-origin', orderId, supportFee },
    window.location.origin
  )
}

export function applySupportFromMessage(value: unknown): ApplySupportRequest | undefined {
  if (!isRecord(value)) return undefined
  if (field(value, 'source') !== LUNCHBOT_SOURCE || field(value, 'type') !== 'apply-support-fee') {
    return undefined
  }
  const requestId = field(value, 'requestId')
  const orderId = field(value, 'orderId')
  const deliveryId = field(value, 'deliveryId')
  const supportFee = readMoney(field(value, 'supportFee'))
  if (
    typeof requestId !== 'string' ||
    typeof orderId !== 'string' ||
    typeof deliveryId !== 'string' ||
    supportFee === null
  ) {
    return undefined
  }
  return { requestId, orderId, deliveryId, supportFee }
}

export function supportFeeResultFromMessage(value: unknown): SupportFeeResult | undefined {
  if (!isRecord(value)) return undefined
  if (
    field(value, 'source') !== LUNCHBOT_SOURCE ||
    field(value, 'type') !== 'support-fee-applied'
  ) {
    return undefined
  }
  const requestId = field(value, 'requestId')
  if (typeof requestId !== 'string') return undefined
  return {
    requestId,
    ok: field(value, 'ok') === true,
    supportFee: readMoney(field(value, 'supportFee')),
    amountDue: readMoney(field(value, 'amountDue')),
    tax: readMoney(field(value, 'tax')),
  }
}

export function feesMatch(left: number, right: number): boolean {
  return Math.abs(left - right) < 0.001
}

/** Dollar to show when Custom is opened from another choice. */
export function customSupportSeed(currentFee: number, quote: SupportQuote): number {
  if (quote.baselineKnown && quote.baselineFee !== null) return quote.baselineFee
  return currentFee
}

export function inferOrderSupport(
  policy: SupportPolicy,
  currentFee: number,
  quote: SupportQuote
): { choice: OrderSupportChoice; percent: number; remember: boolean } {
  const percent = policy.percent
  if (policy.mode === 'percent') {
    const quoted = quotedSupportFee('percent', percent, quote)
    if (quoted !== null && feesMatch(quoted, currentFee)) {
      return { choice: 'percent', percent, remember: true }
    }
  }
  if (policy.mode === 'remaining') {
    const quoted = quotedSupportFee('remaining', percent, quote)
    if (quoted !== null && feesMatch(quoted, currentFee)) {
      return { choice: 'remaining', percent, remember: true }
    }
  }
  if (policy.mode === 'skip' && feesMatch(0, currentFee)) {
    return { choice: 'skip', percent, remember: true }
  }
  if (feesMatch(0, currentFee)) return { choice: 'skip', percent, remember: false }
  const remaining = quote.subsidy?.remaining ?? null
  if (remaining !== null && remaining > 0 && feesMatch(remaining, currentFee)) {
    return { choice: 'remaining', percent, remember: false }
  }
  for (const choice of SUPPORT_PERCENT_CHOICES) {
    const quoted = quotedSupportFee('percent', choice, quote)
    if (quoted !== null && feesMatch(quoted, currentFee)) {
      return { choice: 'percent', percent: choice, remember: false }
    }
  }
  return { choice: 'custom', percent, remember: false }
}

export function orderChoiceMatchesPolicy(
  choice: OrderSupportChoice,
  percent: number,
  policy: SupportPolicy
): boolean {
  if (choice === 'percent') return policy.mode === 'percent' && policy.percent === percent
  if (choice === 'custom') return false
  return policy.mode === choice
}

export function parseSupportAmount(value: string): number | null {
  const trimmed = value.trim().replace(/^\$/, '')
  if (!/^\d+(?:\.\d*)?$/.test(trimmed)) return null
  const amount = Number(trimmed)
  if (!Number.isFinite(amount) || amount < 0 || amount > 999.99) return null
  return roundMoney(amount)
}

export function formatSupportAmount(value: number): string {
  return roundMoney(value).toFixed(2)
}

export function quotedSupportFee(
  mode: SupportPolicy['mode'],
  percent: number,
  quote: SupportQuote
): number | null {
  if (mode === 'default') return quote.baselineFee
  if (mode === 'skip') return 0
  if (mode === 'percent') {
    return roundMoney((Math.max(0, quote.itemsSubtotal) * clampSupportPercent(percent)) / 100)
  }
  if (quote.subsidy === null) return null
  return quote.subsidy.remaining
}

function nearestSupportPercent(percent: number): number {
  let nearest = 10
  for (const choice of SUPPORT_PERCENT_CHOICES) {
    if (Math.abs(choice - percent) < Math.abs(nearest - percent)) nearest = choice
  }
  return nearest
}

export function subsidySnapshotFromDay(cap: unknown, orders: unknown): SubsidySnapshot | null {
  return subsidyRemainingForOrder(cap, orders, null)
}

export function subsidyRemainingForOrder(
  cap: unknown,
  orders: unknown,
  placed: { id: string; subsidy: number } | null
): SubsidySnapshot | null {
  const parsedCap = readMoney(cap)
  if (parsedCap === null) return null
  let used = placed?.subsidy ?? 0
  if (Array.isArray(orders)) {
    for (const item of orders) {
      if (!isRecord(item)) continue
      if (placed !== null && field(item, 'id') === placed.id) continue
      const subsidy = readMoney(field(item, 'subsidy'))
      if (subsidy !== null) used += subsidy
    }
  }
  return { cap: parsedCap, remaining: roundMoney(Math.max(0, parsedCap - used)) }
}

export function placeOrderDeliveryId(url: string, method: string): string | null {
  if (method.toUpperCase() !== 'POST') return null
  let pathname = ''
  try {
    pathname = new URL(url, 'https://lunchdrop.com').pathname
  } catch {
    return null
  }
  const match = /^\/api\/deliveries\/([^/]+)\/order\/?$/.exec(pathname)
  return match?.[1] ?? null
}

export function parsePlacedOrder(value: unknown): PlacedOrder | null {
  if (!isRecord(value)) return null
  const id = field(value, 'id')
  if (typeof id !== 'string') return null
  const supportFee = readMoney(field(value, 'supportFee'))
  const amountDue = readMoney(field(value, 'amountDue'))
  const tax = readMoney(field(value, 'tax'))
  const itemsSubtotal = readMoney(field(value, 'itemsSubtotal'))
  const subsidy = readMoney(field(value, 'subsidy'))
  if (
    supportFee === null ||
    amountDue === null ||
    tax === null ||
    itemsSubtotal === null ||
    subsidy === null
  ) {
    return null
  }

  const order: PlacedOrder = { id, supportFee, amountDue, tax, itemsSubtotal, subsidy }
  const deliveryId = field(value, 'deliveryId')
  if (typeof deliveryId === 'string') order.deliveryId = deliveryId
  const editable = readBoolean(field(value, 'isSupportFeeEditable'))
  if (editable !== null) order.isSupportFeeEditable = editable
  const fixed = readBoolean(field(value, 'isSubsidySupportFeeFixed'))
  if (fixed !== null) order.isSubsidySupportFeeFixed = fixed
  return order
}

/**
 * Fee to send, or null when the placed order should be left alone.
 * Percentage ignores the subsidy. Remaining subsidy is the unused cap, or $0
 * when the day is maxed. None is always $0.
 */
export function desiredSupportFee(
  order: PlacedOrder,
  policy: SupportPolicy,
  subsidy: SubsidySnapshot | null
): number | null {
  if (policy.mode === 'default') return null
  if (order.isSupportFeeEditable === false) return null
  if (order.isSubsidySupportFeeFixed === true) return null

  let fee = 0
  if (policy.mode === 'percent') {
    fee = roundMoney((Math.max(0, order.itemsSubtotal) * policy.percent) / 100)
  } else if (policy.mode === 'remaining') {
    if (subsidy === null) return null
    fee = subsidy.remaining
  }
  fee = roundMoney(Math.max(0, fee))
  if (Math.abs(fee - order.supportFee) < 0.001) return null
  return fee
}

/**
 * Estimate the order after a support-fee change. Tax on the Green Box order
 * was 13% of item subtotal plus support fee, so the fee is in the tax base.
 */
export function orderWithSupportFee(order: PlacedOrder, supportFee: number): PlacedOrder {
  const taxableBase = order.itemsSubtotal + order.supportFee
  const taxRate = taxableBase > 0 ? order.tax / taxableBase : 0
  const tax = roundMoney(taxRate * (order.itemsSubtotal + supportFee))
  const amountDue = roundMoney(order.amountDue - order.supportFee - order.tax + supportFee + tax)
  return { ...order, supportFee, tax, amountDue }
}

export function moneyFromSupportUpdate(value: unknown): {
  supportFee: number
  amountDue: number
  tax: number | null
} | null {
  if (!isRecord(value)) return null
  const supportFee = readMoney(field(value, 'supportFee'))
  const amountDue = readMoney(field(value, 'amountDue'))
  if (supportFee === null || amountDue === null) return null
  return { supportFee, amountDue, tax: readMoney(field(value, 'tax')) }
}

export function formatDollars(value: number): string {
  return `$${value.toFixed(2)}`
}

export function clampSupportPercent(value: number): number {
  return Math.min(MAX_SUPPORT_PERCENT, Math.max(1, Math.round(value)))
}

export function parseJson(text: string): unknown {
  const parsed: unknown = JSON.parse(text)
  return parsed
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function field(record: Record<string, unknown>, key: string): unknown {
  return record[key]
}

function readSubsidySnapshot(value: Record<string, unknown>): SubsidySnapshot | null {
  const cap = readMoney(field(value, 'cap'))
  const remaining = readMoney(field(value, 'remaining'))
  if (cap === null || remaining === null) return null
  return { cap, remaining: roundMoney(Math.max(0, remaining)) }
}

function readMoney(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const amount = Number(value)
    if (Number.isFinite(amount)) return amount
  }
  return null
}

function readPercent(value: unknown): number | null {
  const amount = readMoney(value)
  if (amount === null) return null
  const percent = Math.round(amount)
  if (percent < 0 || percent > MAX_SUPPORT_PERCENT) return null
  return percent
}

function readBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value
  return null
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}
