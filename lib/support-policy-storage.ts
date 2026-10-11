import { browser } from 'wxt/browser'
import { LUNCHBOT_SOURCE, parseSupportPolicy, type SupportPolicy } from './support-policy'

export const SUPPORT_POLICY_STORAGE_KEY = 'supportPolicy'

export async function readSupportPolicy(): Promise<SupportPolicy> {
  const stored = await browser.storage.local.get(SUPPORT_POLICY_STORAGE_KEY)
  return parseSupportPolicy(stored[SUPPORT_POLICY_STORAGE_KEY])
}

export async function writeSupportPolicy(policy: SupportPolicy): Promise<void> {
  await browser.storage.local.set({ [SUPPORT_POLICY_STORAGE_KEY]: policy })
}

const SUPPORT_FEE_ORIGINS_KEY = 'supportFeeOrigins'

/** Lunchdrop's fee for this order, saved from the latest place or meal-change response. */
export async function readSupportOrigin(orderId: string): Promise<number | null> {
  const stored = await browser.storage.local.get(SUPPORT_FEE_ORIGINS_KEY)
  const origins = stored[SUPPORT_FEE_ORIGINS_KEY]
  if (!isBaselineRecord(origins)) return null
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
