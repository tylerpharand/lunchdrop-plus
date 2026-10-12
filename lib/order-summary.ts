export const ORDER_SUMMARY_ACTIONS = [
  { id: 'add-items', label: 'Add more items', snippets: ['Add more items'] },
  { id: 'promo', label: 'Promo code or gift card', snippets: ['promo code or gift card'] },
  { id: 'remove-subsidy', label: 'Remove subsidy', snippets: ['Remove subsidy from this order'] },
  { id: 'info-icons', label: 'Info icons', snippets: [] },
] as const

export type OrderActionId = (typeof ORDER_SUMMARY_ACTIONS)[number]['id']

export type OrderSummaryMode = 'hide-all' | 'show-all' | 'custom'

export interface HideOrderSummary {
  mode: OrderSummaryMode
  hidden: OrderActionId[]
}

const ORDER_ACTION_IDS: readonly OrderActionId[] = ORDER_SUMMARY_ACTIONS.map(action => action.id)

export function defaultHideOrderSummary(): HideOrderSummary {
  return { mode: 'hide-all', hidden: [] }
}

export function parseHideOrderSummary(value: unknown): HideOrderSummary {
  if (!isRecord(value)) return defaultHideOrderSummary()
  const mode = field(value, 'mode')
  if (mode === 'hide-all') return { mode, hidden: [] }
  if (mode === 'show-all') return { mode, hidden: [] }
  if (mode !== 'custom') return defaultHideOrderSummary()
  return { mode, hidden: parseHidden(field(value, 'hidden')) }
}

export function hiddenOrderActionIds(preference: HideOrderSummary): ReadonlySet<OrderActionId> {
  if (preference.mode === 'hide-all') return new Set(ORDER_ACTION_IDS)
  if (preference.mode === 'show-all') return new Set()
  return new Set(preference.hidden)
}

export function withOrderSummaryMode(
  current: HideOrderSummary,
  mode: OrderSummaryMode
): HideOrderSummary {
  if (mode === 'hide-all' || mode === 'show-all') return { mode, hidden: [] }
  if (current.mode === 'hide-all') return { mode: 'custom', hidden: [...ORDER_ACTION_IDS] }
  if (current.mode === 'show-all') return { mode: 'custom', hidden: [] }
  return { mode: 'custom', hidden: current.hidden }
}

export function toggleOrderSummaryAction(
  current: HideOrderSummary,
  id: OrderActionId
): HideOrderSummary {
  const hidden = new Set(hiddenOrderActionIds(current))
  if (hidden.has(id)) hidden.delete(id)
  else hidden.add(id)
  return { mode: 'custom', hidden: ORDER_ACTION_IDS.filter(actionId => hidden.has(actionId)) }
}

export function orderActionIdFromText(text: string): OrderActionId | null {
  for (const action of ORDER_SUMMARY_ACTIONS) {
    for (const snippet of action.snippets) {
      if (text.includes(snippet)) return action.id
    }
  }
  return null
}

export function parseOrderSummaryMode(value: string): OrderSummaryMode | null {
  if (value === 'hide-all' || value === 'show-all' || value === 'custom') return value
  return null
}

function parseHidden(value: unknown): OrderActionId[] {
  if (!Array.isArray(value)) return []
  const ids = new Set<OrderActionId>()
  for (const item of value) {
    if (isOrderActionId(item)) ids.add(item)
  }
  return ORDER_ACTION_IDS.filter(id => ids.has(id))
}

function isOrderActionId(value: unknown): value is OrderActionId {
  return ORDER_ACTION_IDS.some(id => id === value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function field(record: Record<string, unknown>, key: string): unknown {
  return record[key]
}
