import {
  formatDollars,
  LUNCHBOT_SOURCE,
  subsidyRemainingForOrder,
  supportFeeResultFromMessage,
  type OrderSupportContext,
  type PlacedOrder,
  type SupportQuote,
} from '../../lib/support-policy'

export function subsidyForOrder(
  context: OrderSupportContext | null,
  order: PlacedOrder | null
): SupportQuote['subsidy'] {
  if (order === null) return null
  if (context === null) return null
  if (context.subsidy === null) return null
  return subsidyRemainingForOrder(context.subsidy.cap, context.orders, {
    id: order.id,
    itemsSubtotal: order.itemsSubtotal,
  })
}

export function pickOrder(
  orders: PlacedOrder[],
  supportLabel: string,
  pinnedId: string | null
): PlacedOrder | null {
  const pinned = orders.find(item => item.id === pinnedId)
  if (pinned !== undefined) return pinned
  const labeled = orders.find(item => formatDollars(item.supportFee) === supportLabel.trim())
  if (labeled !== undefined) return labeled
  return orders.length === 1 ? (orders[0] ?? null) : null
}

export function postSupportFee(
  orderId: string,
  deliveryId: string,
  supportFee: number
): Promise<boolean> {
  const requestId = crypto.randomUUID()
  return new Promise(resolve => {
    let settled = false
    const finish = (ok: boolean): void => {
      if (settled) return
      settled = true
      window.removeEventListener('message', onMessage)
      window.clearTimeout(timer)
      if (ok) {
        window.postMessage(
          { source: LUNCHBOT_SOURCE, type: 'request-subsidy-context' },
          window.location.origin
        )
      }
      resolve(ok)
    }
    const onMessage = (event: MessageEvent): void => {
      if (event.source !== window) return
      const result = supportFeeResultFromMessage(event.data)
      if (result?.requestId !== requestId) return
      finish(result.ok)
    }
    const timer = window.setTimeout(() => {
      finish(false)
    }, 8000)
    window.addEventListener('message', onMessage)
    window.postMessage(
      {
        source: LUNCHBOT_SOURCE,
        type: 'apply-support-fee',
        requestId,
        orderId,
        deliveryId,
        supportFee,
      },
      window.location.origin
    )
  })
}
