import {
  desiredSupportFee,
  isRecord,
  LUNCHBOT_SOURCE,
  moneyFromSupportUpdate,
  orderWithSupportFee,
  parseJson,
  parsePlacedOrder,
  publishSupportOrigin,
  type ApplySupportRequest,
  type OrderMutation,
  type PlacedOrder,
  type SupportPolicy,
} from '../../lib/support-policy'
import { patchVisibleOrder, readOrderSupportContext, readSubsidySnapshot } from './page-orders'

export async function settlePlacedOrder(
  originalFetch: typeof fetch,
  rawText: string,
  mutation: OrderMutation,
  policy: SupportPolicy
): Promise<Record<string, unknown> | null> {
  const raw = parseJson(rawText)
  if (!isRecord(raw)) return null
  const carrier = orderCarrier(raw)
  if (carrier === null) return null
  const { order } = carrier
  publishSupportOrigin(order.id, order.supportFee, mutation.replacesOrigin)

  const subsidy = policy.mode === 'remaining' ? readSubsidySnapshot(order) : null
  if (policy.mode === 'remaining' && subsidy === null) {
    console.warn('Lunchdrop+ could not see the subsidy cap, so the support fee was left as placed')
    return null
  }
  const desired = desiredSupportFee(order, policy, subsidy)
  if (desired === null) return null

  const targetDeliveryId = order.deliveryId ?? mutation.deliveryId
  let next = orderWithSupportFee(order, desired)
  try {
    const update = await postSupportFee(originalFetch, targetDeliveryId, order.id, desired)
    if (isRecord(update) && parsePlacedOrder(update) !== null && carrier.record === raw) {
      return update
    }
    const money = moneyFromSupportUpdate(update)
    if (money !== null) {
      next = {
        ...next,
        supportFee: money.supportFee,
        amountDue: money.amountDue,
        ...(money.tax === null ? {} : { tax: money.tax }),
      }
    }
  } catch (error) {
    console.warn('Lunchdrop+ could not set the support fee', error)
    return null
  }

  const patched = patchOrderRecord(carrier.record, next)
  if (!isRecord(patched)) return null
  if (carrier.record === raw) return patched
  return { ...raw, order: patched }
}

export async function replyToSupportApply(
  originalFetch: typeof fetch,
  request: ApplySupportRequest | undefined
): Promise<void> {
  if (request === undefined) return
  const failed = {
    source: LUNCHBOT_SOURCE,
    type: 'support-fee-applied',
    requestId: request.requestId,
    ok: false,
    supportFee: null,
    amountDue: null,
    tax: null,
  }
  const current = readOrderSupportContext().orders.find(order => order.id === request.orderId)
  if (current?.deliveryId === undefined) {
    window.postMessage(failed, window.location.origin)
    return
  }
  try {
    const update = await postSupportFee(
      originalFetch,
      request.deliveryId,
      request.orderId,
      request.supportFee
    )
    const money = moneyFromSupportUpdate(update)
    const estimated = orderWithSupportFee(current, request.supportFee)
    const supportFee = money?.supportFee ?? request.supportFee
    const amountDue = money?.amountDue ?? estimated.amountDue
    const tax = money?.tax ?? estimated.tax
    patchVisibleOrder(request.orderId, supportFee, amountDue, tax)
    window.postMessage(
      {
        source: LUNCHBOT_SOURCE,
        type: 'support-fee-applied',
        requestId: request.requestId,
        ok: true,
        supportFee,
        amountDue,
        tax,
      },
      window.location.origin
    )
  } catch (error) {
    console.warn('Lunchdrop+ could not set the support fee', error)
    window.postMessage(failed, window.location.origin)
  }
}

function orderCarrier(
  raw: Record<string, unknown>
): { record: Record<string, unknown>; order: PlacedOrder } | null {
  const direct = parsePlacedOrder(raw)
  if (direct !== null) return { record: raw, order: direct }
  const nested = raw['order']
  if (!isRecord(nested)) return null
  const order = parsePlacedOrder(nested)
  if (order === null) return null
  return { record: nested, order }
}

async function postSupportFee(
  originalFetch: typeof fetch,
  deliveryId: string,
  orderId: string,
  supportFee: number
): Promise<unknown> {
  const response = await originalFetch(`/api/deliveries/${deliveryId}/order/support-fee`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      accept: 'application/json, text/plain, */*',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ orderId, supportFee: supportFee.toFixed(2) }),
  })
  if (!response.ok) {
    throw new Error(`Support fee update failed (${String(response.status)})`)
  }
  const text = await response.text()
  if (text.trim() === '') return null
  return parseJson(text)
}

function patchOrderRecord(raw: unknown, order: PlacedOrder): unknown {
  if (!isRecord(raw)) return order
  return {
    ...raw,
    supportFee: order.supportFee,
    amountDue: order.amountDue,
    tax: order.tax,
  }
}
