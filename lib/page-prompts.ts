const MISC_PROMPT_SNIPPETS = [
  'daily reminders',
  'How was',
  'FREE LUNCHES',
  'Share Lunchdrop',
  'Invite a guest',
] as const

export function parseHidePagePrompts(value: unknown): boolean {
  return value === true
}

export function isMiscPrompt(text: string): boolean {
  for (const snippet of MISC_PROMPT_SNIPPETS) {
    if (text.includes(snippet)) return true
  }
  return false
}
