import {
  isRecord,
  LUNCHBOT_SOURCE,
  parsePlacedOrder,
  subsidyRemainingForOrder,
  subsidySnapshotFromDay,
  type OrderSupportContext,
  type PlacedOrder,
  type SubsidySnapshot,
} from '../../lib/support-policy'

export function publishOrderSupport(): void {
  const context = readOrderSupportContext()
  window.postMessage(
    {
      source: LUNCHBOT_SOURCE,
      type: 'subsidy-context',
      cap: context.subsidy?.cap ?? null,
      remaining: context.subsidy?.remaining ?? null,
      orders: context.orders,
    },
    window.location.origin
  )
}

export function readOrderSupportContext(): OrderSupportContext {
  const day = readCurrentLunchday()
  const account = readAccount()
  const orders: PlacedOrder[] = []
  if (day !== null) {
    collectOrders(field(day, 'orders'), orders)
    const deliveries = field(day, 'deliveries')
    if (Array.isArray(deliveries)) {
      for (const delivery of deliveries) {
        if (!isRecord(delivery)) continue
        collectOrders(field(delivery, 'orders'), orders)
      }
    }
  }
  if (account !== null) {
    const delivery = asRecord(field(account, 'delivery'))
    if (delivery !== null) collectOrders(field(delivery, 'orders'), orders)
  }
  return {
    orders,
    subsidy:
      day === null ? null : subsidySnapshotFromDay(field(day, 'subsidyCap'), field(day, 'orders')),
  }
}

export function patchVisibleOrder(
  orderId: string,
  supportFee: number,
  amountDue: number,
  tax: number
): void {
  const day = readCurrentLunchday()
  const account = readAccount()
  if (day !== null) {
    patchOrderList(field(day, 'orders'), orderId, supportFee, amountDue, tax)
    const deliveries = field(day, 'deliveries')
    if (Array.isArray(deliveries)) {
      for (const delivery of deliveries) {
        if (!isRecord(delivery)) continue
        patchOrderList(field(delivery, 'orders'), orderId, supportFee, amountDue, tax)
      }
    }
  }
  if (account !== null) {
    const delivery = asRecord(field(account, 'delivery'))
    if (delivery !== null) {
      patchOrderList(field(delivery, 'orders'), orderId, supportFee, amountDue, tax)
    }
  }
}

export function readSubsidySnapshot(placed: PlacedOrder | null): SubsidySnapshot | null {
  const day = readCurrentLunchday()
  if (day === null) return null
  const cap = field(day, 'subsidyCap')
  const orders = field(day, 'orders')
  if (placed === null) return subsidySnapshotFromDay(cap, orders)
  return subsidyRemainingForOrder(cap, orders, {
    id: placed.id,
    itemsSubtotal: placed.itemsSubtotal,
  })
}

function collectOrders(list: unknown, orders: PlacedOrder[]): void {
  if (!Array.isArray(list)) return
  for (const item of list) {
    const order = parsePlacedOrder(item)
    if (order?.deliveryId === undefined) continue
    if (orders.some(existing => existing.id === order.id)) continue
    orders.push(order)
  }
}

function patchOrderList(
  list: unknown,
  orderId: string,
  supportFee: number,
  amountDue: number,
  tax: number
): void {
  if (!Array.isArray(list)) return
  for (const item of list) {
    if (!isRecord(item) || field(item, 'id') !== orderId) continue
    item['supportFee'] = supportFee
    item['amountDue'] = amountDue
    item['tax'] = tax
  }
}

function readAccount(): Record<string, unknown> | null {
  return readPiniaSlice('account')
}

function readPiniaSlice(name: string): Record<string, unknown> | null {
  const app = document.querySelector('#app')
  if (app === null) return null
  const vue = asRecord(field(asRecord(app) ?? {}, '__vue_app__'))
  const config = asRecord(field(vue ?? {}, 'config'))
  const globals = asRecord(field(config ?? {}, 'globalProperties'))
  const pinia = asRecord(field(globals ?? {}, '$pinia'))
  const state = asRecord(field(pinia ?? {}, 'state'))
  const value = asRecord(field(state ?? {}, 'value'))
  return asRecord(field(value ?? {}, name))
}

function readCurrentLunchday(): Record<string, unknown> | null {
  const account = readAccount()
  if (account === null) return null
  return asRecord(field(account, 'currentLunchday'))
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return isRecord(value) ? value : null
}

function field(record: Record<string, unknown>, key: string): unknown {
  return record[key]
}
