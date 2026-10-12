import { browser } from 'wxt/browser'
import {
  LUNCHBOT_SOURCE,
  parseOrderChoiceMemory,
  parseSupportPolicy,
  type OrderChoiceMemory,
  type SupportPolicy,
} from './support-policy'

export const SUPPORT_POLICY_STORAGE_KEY = 'supportPolicy'

export async function readSupportPolicy(): Promise<SupportPolicy> {
  const stored = await browser.storage.local.get(SUPPORT_POLICY_STORAGE_KEY)
  return parseSupportPolicy(stored[SUPPORT_POLICY_STORAGE_KEY])
}

export async function writeSupportPolicy(policy: SupportPolicy): Promise<void> {
  await browser.storage.local.set({ [SUPPORT_POLICY_STORAGE_KEY]: policy })
}

const SUPPORT_FEE_ORIGINS_KEY = 'supportFeeOrigins'

export async function readSupportOrigins(): Promise<Record<string, number>> {
  const stored = await browser.storage.local.get(SUPPORT_FEE_ORIGINS_KEY)
  const origins = stored[SUPPORT_FEE_ORIGINS_KEY]
  if (!isBaselineRecord(origins)) return {}
  const next: Record<string, number> = {}
  for (const [orderId, fee] of Object.entries(origins)) {
    if (typeof fee === 'number' && Number.isFinite(fee)) next[orderId] = fee
  }
  return next
}

/** Lunchdrop's fee for this order, saved from the latest place or meal-change response. */
export async function readSupportOrigin(orderId: string): Promise<number | null> {
  const origins = await readSupportOrigins()
  const fee = origins[orderId]
  return typeof fee === 'number' && Number.isFinite(fee) ? fee : null
}

/**
 * The first place response sticks. A meal change replaces it with Lunchdrop's new fee.
 */
export async function rememberSupportOrigin(
  orderId: string,
  fee: number,
  replace = false
): Promise<number> {
  if (!replace) {
    const existing = await readSupportOrigin(orderId)
    if (existing !== null) return existing
  }
  const stored = await browser.storage.local.get(SUPPORT_FEE_ORIGINS_KEY)
  const origins = stored[SUPPORT_FEE_ORIGINS_KEY]
  const next: Record<string, number> = isBaselineRecord(origins) ? { ...origins } : {}
  next[orderId] = fee
  await browser.storage.local.set({ [SUPPORT_FEE_ORIGINS_KEY]: next })
  return fee
}

const ORDER_CHOICE_KEY = 'supportOrderChoices'

const orderChoiceCache = new Map<string, OrderChoiceMemory | null>()

/** `undefined` until this order has been read. */
export function peekOrderChoice(orderId: string): OrderChoiceMemory | null | undefined {
  if (!orderChoiceCache.has(orderId)) return undefined
  return orderChoiceCache.get(orderId) ?? null
}

export async function readOrderChoice(orderId: string): Promise<OrderChoiceMemory | null> {
  const peeked = peekOrderChoice(orderId)
  if (peeked !== undefined) return peeked
  try {
    const stored = await browser.storage.local.get(ORDER_CHOICE_KEY)
    if (orderChoiceCache.has(orderId)) return orderChoiceCache.get(orderId) ?? null
    const choices = stored[ORDER_CHOICE_KEY]
    const parsed = isChoiceRecord(choices) ? parseOrderChoiceMemory(choices[orderId]) : null
    orderChoiceCache.set(orderId, parsed)
    return parsed
  } catch (error) {
    console.warn('Lunchdrop+ could not read the support choice', error)
    if (!orderChoiceCache.has(orderId)) orderChoiceCache.set(orderId, null)
    return orderChoiceCache.get(orderId) ?? null
  }
}

/** `null` forgets the choice. A later read in this page keeps the write. */
export function writeOrderChoice(orderId: string, choice: OrderChoiceMemory | null): void {
  orderChoiceCache.set(orderId, choice)
  void persistOrderChoice(orderId, choice).catch((error: unknown) => {
    console.warn('Lunchdrop+ could not save the support choice', error)
  })
}

async function persistOrderChoice(
  orderId: string,
  choice: OrderChoiceMemory | null
): Promise<void> {
  const stored = await browser.storage.local.get(ORDER_CHOICE_KEY)
  const choices = stored[ORDER_CHOICE_KEY]
  const next: Record<string, OrderChoiceMemory> = {}
  if (isChoiceRecord(choices)) {
    for (const [id, value] of Object.entries(choices)) {
      if (choice === null && id === orderId) continue
      const parsed = parseOrderChoiceMemory(value)
      if (parsed !== null) next[id] = parsed
    }
  }
  if (choice !== null) next[orderId] = choice
  await browser.storage.local.set({ [ORDER_CHOICE_KEY]: next })
}

function isChoiceRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isBaselineRecord(value: unknown): value is Record<string, number> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  return true
}

export function publishSupportPolicy(policy: SupportPolicy): void {
  window.postMessage(
    { source: LUNCHBOT_SOURCE, type: 'support-policy', policy },
    window.location.origin
  )
}
