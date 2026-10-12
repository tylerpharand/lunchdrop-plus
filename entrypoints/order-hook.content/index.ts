import {
  applySupportFromMessage,
  defaultSupportPolicy,
  isSubsidyRequestMessage,
  LUNCHBOT_SOURCE,
  orderMutation,
  policyFromMessage,
  type OrderMutation,
  type SupportPolicy,
} from '../../lib/support-policy'
import { publishOrderSupport } from './page-orders'
import { replyToSupportApply, settlePlacedOrder } from './settle-order'

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
    const mutation = orderMutation(requestUrl(input), requestMethod(input, init))
    if (mutation === null || !response.ok) return response
    try {
      const patched = await settlePlacedOrder(
        originalFetch,
        await response.clone().text(),
        mutation,
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
    const mutation = meta === undefined ? null : orderMutation(meta.url, meta.method)
    if (mutation !== null) holdPlacedOrder(this, mutation, originalFetch, readPolicy)
    callSend(this, body)
  }
}

function holdPlacedOrder(
  xhr: XMLHttpRequest,
  mutation: OrderMutation,
  originalFetch: typeof fetch,
  readPolicy: () => Promise<SupportPolicy>
): void {
  const finish = xhr.onloadend
  if (typeof finish !== 'function') return
  xhr.onloadend = event => {
    void applyPlacedOrder(xhr, mutation, originalFetch, readPolicy).finally(() => {
      finish.call(xhr, event)
    })
  }
}

async function applyPlacedOrder(
  xhr: XMLHttpRequest,
  mutation: OrderMutation,
  originalFetch: typeof fetch,
  readPolicy: () => Promise<SupportPolicy>
): Promise<void> {
  if (xhr.status < 200 || xhr.status >= 300 || xhr.responseText === '') return
  try {
    const patched = await settlePlacedOrder(
      originalFetch,
      xhr.responseText,
      mutation,
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
