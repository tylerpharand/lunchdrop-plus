export const PAGE_PROMPTS = [
  { id: 'reminders', label: 'Reminders', snippets: ['daily reminders'] },
  { id: 'ratings', label: 'Meal ratings', snippets: ['How was'] },
  { id: 'referrals', label: 'Referral offers', snippets: ['FREE LUNCHES', 'Share Lunchdrop'] },
  { id: 'invites', label: 'Invites', snippets: ['Invite a guest'] },
] as const

export type PagePromptId = (typeof PAGE_PROMPTS)[number]['id']

export type PagePromptMode = 'hide-all' | 'show-all' | 'custom'

export interface HidePagePrompts {
  mode: PagePromptMode
  hidden: PagePromptId[]
}

const PAGE_PROMPT_IDS: readonly PagePromptId[] = PAGE_PROMPTS.map(prompt => prompt.id)

export function defaultHidePagePrompts(): HidePagePrompts {
  return { mode: 'show-all', hidden: [] }
}

export function parseHidePagePrompts(value: unknown): HidePagePrompts {
  if (value === true) return { mode: 'hide-all', hidden: [] }
  if (!isRecord(value)) return defaultHidePagePrompts()
  const mode = field(value, 'mode')
  if (mode === 'hide-all') return { mode, hidden: [] }
  if (mode === 'show-all') return { mode, hidden: [] }
  if (mode !== 'custom') return defaultHidePagePrompts()
  return { mode, hidden: parseHidden(field(value, 'hidden')) }
}

export function hiddenPromptIds(preference: HidePagePrompts): ReadonlySet<PagePromptId> {
  if (preference.mode === 'hide-all') return new Set(PAGE_PROMPT_IDS)
  if (preference.mode === 'show-all') return new Set()
  return new Set(preference.hidden)
}

export function withPromptMode(current: HidePagePrompts, mode: PagePromptMode): HidePagePrompts {
  if (mode === 'hide-all' || mode === 'show-all') return { mode, hidden: [] }
  if (current.mode === 'hide-all') return { mode: 'custom', hidden: [...PAGE_PROMPT_IDS] }
  if (current.mode === 'show-all') return { mode: 'custom', hidden: [] }
  return { mode: 'custom', hidden: current.hidden }
}

export function togglePagePrompt(current: HidePagePrompts, id: PagePromptId): HidePagePrompts {
  const hidden = new Set(hiddenPromptIds(current))
  if (hidden.has(id)) hidden.delete(id)
  else hidden.add(id)
  return { mode: 'custom', hidden: PAGE_PROMPT_IDS.filter(promptId => hidden.has(promptId)) }
}

export function pagePromptIdFromText(text: string): PagePromptId | null {
  for (const prompt of PAGE_PROMPTS) {
    for (const snippet of prompt.snippets) {
      if (text.includes(snippet)) return prompt.id
    }
  }
  return null
}

export function parsePagePromptMode(value: string): PagePromptMode | null {
  if (value === 'hide-all' || value === 'show-all' || value === 'custom') return value
  return null
}

function parseHidden(value: unknown): PagePromptId[] {
  if (!Array.isArray(value)) return []
  const ids = new Set<PagePromptId>()
  for (const item of value) {
    if (isPagePromptId(item)) ids.add(item)
  }
  return PAGE_PROMPT_IDS.filter(id => ids.has(id))
}

function isPagePromptId(value: unknown): value is PagePromptId {
  return PAGE_PROMPT_IDS.some(id => id === value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function field(record: Record<string, unknown>, key: string): unknown {
  return record[key]
}
