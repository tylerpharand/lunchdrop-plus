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

const SUPPORT_FEE_BASELINES_KEY = 'supportFeeBaselines'

export async function readSupportBaseline(orderId: string): Promise<number | null> {
  const stored = await browser.storage.local.get(SUPPORT_FEE_BASELINES_KEY)
  const baselines = stored[SUPPORT_FEE_BASELINES_KEY]
  if (!isBaselineRecord(baselines)) return null
  const fee = baselines[orderId]
  return typeof fee === 'number' && Number.isFinite(fee) ? fee : null
}

/** Keeps the first fee seen for an order, which is Lunchdrop's own amount. */
export async function rememberSupportBaseline(orderId: string, fee: number): Promise<number> {
  const existing = await readSupportBaseline(orderId)
  if (existing !== null) return existing
  const stored = await browser.storage.local.get(SUPPORT_FEE_BASELINES_KEY)
  const baselines = stored[SUPPORT_FEE_BASELINES_KEY]
  const next: Record<string, number> = isBaselineRecord(baselines) ? { ...baselines } : {}
  next[orderId] = fee
  await browser.storage.local.set({ [SUPPORT_FEE_BASELINES_KEY]: next })
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
