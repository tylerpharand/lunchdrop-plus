import {
  applySupportFromMessage,
  desiredSupportFee,
  isRecord,
  isSubsidyRequestMessage,
  policyFromMessage,
  LUNCHBOT_SOURCE,
  moneyFromSupportUpdate,
  orderWithSupportFee,
  parseJson,
  parsePlacedOrder,
  placeOrderDeliveryId,
  subsidyRemainingForOrder,
  subsidySnapshotFromDay,
  type OrderSupportContext,
  defaultSupportPolicy,
  type PlacedOrder,
  type SubsidySnapshot,
  type SupportPolicy,
} from '../lib/support-policy'

export default defineContentScript({
  matches: ['*://*.lunchdrop.com/*', '*://lunchdrop.com/*'],
  runAt: 'document_start',
  world: 'MAIN',
  main() {
    installOrderHook()
  },
})

function installOrderHook(): void {
  if (window.__lunchbotOrderHook === true) return
  window.__lunchbotOrderHook = true

  let policy: SupportPolicy = defaultSupportPolicy()
  let policyVersion = 0
  const policyWaiters: (() => void)[] = []
  const originalFetch = window.fetch.bind(window)
  const rememberPolicy = (next: SupportPolicy): void => {
    policy = next
    policyVersion += 1
    const pending = policyWaiters.splice(0)
    for (const waiter of pending) waiter()
  }
  const readPolicy = async (): Promise<SupportPolicy> => {
    if (policyVersion === 0) {
      await new Promise<void>(resolve => {
        const waiter = (): void => {
          window.clearTimeout(timer)
          resolve()
        }
        const timer = window.setTimeout(() => {
          const index = policyWaiters.indexOf(waiter)
          if (index !== -1) policyWaiters.splice(index, 1)
          resolve()
        }, POLICY_WAIT_MS)
        policyWaiters.push(waiter)
      })
    }
    return policy
  }

  window.addEventListener('message', event => {
    if (event.source !== window) return
    const next = policyFromMessage(event.data)
    if (next !== null) rememberPolicy(next)
    if (isSubsidyRequestMessage(event.data)) publishOrderSupport()
    const apply = applySupportFromMessage(event.data)
    if (apply === undefined) return
    void replyToSupportApply(originalFetch, apply)
  })
  window.postMessage(
    { source: LUNCHBOT_SOURCE, type: 'request-support-policy' },
    window.location.origin
  )

  // Lunchdrop places orders through axios, which uses XMLHttpRequest.
  installPlaceOrderXhr(originalFetch, readPolicy)

  window.fetch = async (input, init) => {
    const response = await originalFetch(input, init)
    const deliveryId = placeOrderDeliveryId(requestUrl(input), requestMethod(input, init))
    if (deliveryId === null || !response.ok) return response
    try {
      const patched = await settlePlacedOrder(
        originalFetch,
        await response.clone().text(),
        deliveryId,
        await readPolicy()
      )
      return patched === null ? response : jsonResponse(response, patched)
    } catch (error) {
      console.warn('Lunchdrop+ left the placed order unchanged', error)
      return response
    }
  }
}

const POLICY_WAIT_MS = 1500

function installPlaceOrderXhr(
  originalFetch: typeof fetch,
  readPolicy: () => Promise<SupportPolicy>
): void {
  const requests = new WeakMap<XMLHttpRequest, { method: string; url: string }>()
  const callOpen = Function.prototype.call.bind(
    Reflect.get<XMLHttpRequest, 'open'>(XMLHttpRequest.prototype, 'open')
  ) as (
    xhr: XMLHttpRequest,
    method: string,
    url: string | URL,
    async: boolean,
    username?: string | null,
    password?: string | null
  ) => void
  const callSend = Function.prototype.call.bind(
    Reflect.get<XMLHttpRequest, 'send'>(XMLHttpRequest.prototype, 'send')
  ) as (xhr: XMLHttpRequest, body?: Document | XMLHttpRequestBodyInit | null) => void

  XMLHttpRequest.prototype.open = function (
    method: string,
    url: string | URL,
    async?: boolean,
    username?: string | null,
    password?: string | null
  ): void {
    requests.set(this, { method, url: String(url) })
    callOpen(this, method, url, async ?? true, username, password)
  }

  XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null): void {
    const meta = requests.get(this)
    const deliveryId = meta === undefined ? null : placeOrderDeliveryId(meta.url, meta.method)
    if (deliveryId !== null) holdPlacedOrder(this, deliveryId, originalFetch, readPolicy)
    callSend(this, body)
  }
}

function holdPlacedOrder(
  xhr: XMLHttpRequest,
  deliveryId: string,
  originalFetch: typeof fetch,
  readPolicy: () => Promise<SupportPolicy>
): void {
  const finish = xhr.onloadend
  if (typeof finish !== 'function') return
  xhr.onloadend = event => {
    void applyPlacedOrder(xhr, deliveryId, originalFetch, readPolicy).finally(() => {
      finish.call(xhr, event)
    })
  }
}

async function applyPlacedOrder(
  xhr: XMLHttpRequest,
  deliveryId: string,
  originalFetch: typeof fetch,
  readPolicy: () => Promise<SupportPolicy>
): Promise<void> {
  if (xhr.status < 200 || xhr.status >= 300 || xhr.responseText === '') return
  try {
    const patched = await settlePlacedOrder(
      originalFetch,
      xhr.responseText,
      deliveryId,
      await readPolicy()
    )
    if (patched === null) return
    const body = JSON.stringify(patched)
    Object.defineProperty(xhr, 'responseText', { configurable: true, get: () => body })
    Object.defineProperty(xhr, 'response', { configurable: true, get: () => body })
  } catch (error) {
    console.warn('Lunchdrop+ left the placed order unchanged', error)
  }
}

async function settlePlacedOrder(
  originalFetch: typeof fetch,
  rawText: string,
  deliveryId: string,
  policy: SupportPolicy
): Promise<Record<string, unknown> | null> {
  const raw = parseJson(rawText)
  const order = parsePlacedOrder(raw)
  if (order === null) return null

  const subsidy = policy.mode === 'remaining' ? readSubsidySnapshot(order) : null
  if (policy.mode === 'remaining' && subsidy === null) {
    console.warn('Lunchdrop+ could not see the subsidy cap, so the support fee was left as placed')
    return null
  }
  const desired = desiredSupportFee(order, policy, subsidy)
  if (desired === null) return null

  const targetDeliveryId = order.deliveryId ?? deliveryId
  let next = orderWithSupportFee(order, desired)
  try {
    const update = await postSupportFee(originalFetch, targetDeliveryId, order.id, desired)
    if (isRecord(update) && parsePlacedOrder(update) !== null) return update
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

  const patched = patchOrderRecord(raw, next)
  return isRecord(patched) ? patched : null
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

function jsonResponse(response: Response, body: unknown): Response {
  const headers = new Headers(response.headers)
  headers.delete('content-length')
  headers.set('content-type', 'application/json')
  return new Response(JSON.stringify(body), {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.href
  return input.url
}

function publishOrderSupport(): void {
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

async function replyToSupportApply(
  originalFetch: typeof fetch,
  request: ReturnType<typeof applySupportFromMessage>
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

function readOrderSupportContext(): OrderSupportContext {
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

function collectOrders(list: unknown, orders: PlacedOrder[]): void {
  if (!Array.isArray(list)) return
  for (const item of list) {
    const order = parsePlacedOrder(item)
    if (order?.deliveryId === undefined) continue
    if (orders.some(existing => existing.id === order.id)) continue
    orders.push(order)
  }
}

function patchVisibleOrder(
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

function readSubsidySnapshot(placed: PlacedOrder | null): SubsidySnapshot | null {
  const day = readCurrentLunchday()
  if (day === null) return null
  const cap = field(day, 'subsidyCap')
  const orders = field(day, 'orders')
  if (placed === null) return subsidySnapshotFromDay(cap, orders)
  return subsidyRemainingForOrder(cap, orders, { id: placed.id, subsidy: placed.subsidy })
}

function readAccount(): Record<string, unknown> | null {
  const app = document.querySelector('#app')
  if (app === null) return null
  const vue = asRecord(field(asRecord(app) ?? {}, '__vue_app__'))
  const config = asRecord(field(vue ?? {}, 'config'))
  const globals = asRecord(field(config ?? {}, 'globalProperties'))
  const pinia = asRecord(field(globals ?? {}, '$pinia'))
  const state = asRecord(field(pinia ?? {}, 'state'))
  const value = asRecord(field(state ?? {}, 'value'))
  return asRecord(field(value ?? {}, 'account'))
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

function requestMethod(input: RequestInfo | URL, init: RequestInit | undefined): string {
  if (init?.method !== undefined) return init.method
  if (typeof input !== 'string' && !(input instanceof URL)) return input.method
  return 'GET'
}

declare global {
  interface Window {
    __lunchbotOrderHook?: boolean
  }
}
