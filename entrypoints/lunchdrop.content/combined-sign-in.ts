const MARK = 'data-lunchbot-combined-sign-in'
const ADDED = 'data-lunchbot-sign-in-added'
const METHOD_WAS = 'data-lunchbot-sign-in-method'
const SUBMIT_WAS = 'data-lunchbot-sign-in-submit'
const EMAIL_WAS_HIDDEN = 'data-lunchbot-sign-in-email-hidden'
const AUTOCOMPLETE_WAS = 'data-lunchbot-sign-in-autocomplete'
const PARAGRAPH_HIDDEN = 'data-lunchbot-sign-in-paragraph'

const submitGuards = new WeakMap<HTMLFormElement, AbortController>()
let observer: MutationObserver | null = null
let applying = false

export function syncCombinedSignIn(enabled: boolean): void {
  if (!isSignInPage()) return
  if (!enabled) {
    removeCombinedSignIn()
    return
  }
  ensureObserver()
  applyCombinedSignIn()
}

export function removeCombinedSignIn(): void {
  observer?.disconnect()
  observer = null
  if (!isSignInPage()) return
  const form = signInForm()
  if (form !== null) restore(form)
}

function ensureObserver(): void {
  if (observer !== null) return
  observer = new MutationObserver(() => {
    applyCombinedSignIn()
  })
  observer.observe(document.documentElement, { childList: true, subtree: true })
}

function applyCombinedSignIn(): void {
  if (applying) return
  const form = signInForm()
  if (form === null || form.getAttribute(MARK) === 'true') return
  applying = true
  try {
    applyTo(form)
  } finally {
    applying = false
  }
}

function applyTo(form: HTMLFormElement): void {
  const email = namedInput(form, 'email')
  if (email === null) return
  const password = namedInput(form, 'password')
  if (password === null) {
    if (!isEmailStep(form, email)) return
    if (namedInput(form, '_token') === null && csrfToken() === null) return
    ensureToken(form)
    ensurePasswordField(form, email)
    ensureRemember(form)
    rememberMethod(form)
    retitleSubmit(form)
    bindBlankPasswordContinue(form)
  } else if (email.type === 'hidden' || email.getAttribute(EMAIL_WAS_HIDDEN) === 'true') {
    revealEmail(form, email)
  }

  const visibleEmail = namedInput(form, 'email')
  const visiblePassword = namedInput(form, 'password')
  if (visibleEmail === null || visiblePassword === null) return
  if (visibleEmail.type === 'hidden') return
  setAutocomplete(visibleEmail, 'username')
  setAutocomplete(visiblePassword, 'current-password')
  form.setAttribute(MARK, 'true')
}

function isEmailStep(form: HTMLFormElement, email: HTMLInputElement): boolean {
  if (email.type === 'hidden') return false
  if (form.method !== 'get' && !form.hasAttribute(METHOD_WAS)) return false
  const submit = submitControl(form)
  if (submit === null) return false
  return (submit.getAttribute(SUBMIT_WAS) ?? submit.value) === 'Continue'
}

function ensureToken(form: HTMLFormElement): void {
  if (namedInput(form, '_token') !== null) return
  const token = csrfToken()
  if (token === null) return
  const input = document.createElement('input')
  input.type = 'hidden'
  input.name = '_token'
  input.value = token
  input.setAttribute(ADDED, 'token')
  form.prepend(input)
}

function ensurePasswordField(form: HTMLFormElement, email: HTMLInputElement): void {
  if (namedInput(form, 'password') !== null) return
  const group = document.createElement('div')
  group.className = 'form-group text-left'
  group.setAttribute(ADDED, 'password')
  const label = document.createElement('label')
  label.textContent = 'Password'
  const input = document.createElement('input')
  input.className = 'form-control input-lg'
  input.name = 'password'
  input.type = 'password'
  group.append(label, input)
  const anchor = email.closest('.form-group') ?? email
  anchor.insertAdjacentElement('afterend', group)
}

function ensureRemember(form: HTMLFormElement): void {
  if (namedInput(form, 'remember') !== null) return
  const group = document.createElement('div')
  group.className = 'form-group'
  group.setAttribute(ADDED, 'remember')
  const checkbox = document.createElement('div')
  checkbox.className = 'checkbox text-left'
  const label = document.createElement('label')
  const input = document.createElement('input')
  input.type = 'checkbox'
  input.name = 'remember'
  input.value = '1'
  input.checked = true
  label.append(input, ' Remember me')
  checkbox.append(label)
  group.append(checkbox)
  const submit = submitControl(form)
  const anchor = submit?.parentElement
  if (anchor?.parentElement === form) {
    form.insertBefore(group, anchor)
  } else {
    form.append(group)
  }
}

function rememberMethod(form: HTMLFormElement): void {
  if (!form.hasAttribute(METHOD_WAS)) form.setAttribute(METHOD_WAS, form.method)
  form.method = 'post'
}

function retitleSubmit(form: HTMLFormElement): void {
  const submit = submitControl(form)
  if (submit === null) return
  if (!submit.hasAttribute(SUBMIT_WAS)) submit.setAttribute(SUBMIT_WAS, submit.value)
  submit.value = 'Sign in'
}

function revealEmail(form: HTMLFormElement, email: HTMLInputElement): void {
  if (email.getAttribute(EMAIL_WAS_HIDDEN) !== 'true' && email.type === 'hidden') {
    email.type = 'text'
    email.classList.add('form-control', 'input-lg')
    email.required = true
    email.setAttribute(EMAIL_WAS_HIDDEN, 'true')
    const group = document.createElement('div')
    group.className = 'form-group text-left'
    group.setAttribute(ADDED, 'email')
    const label = document.createElement('label')
    label.textContent = 'Phone Number or Email Address'
    group.append(label, email)
    const password = namedInput(form, 'password')
    const before = password?.closest('.form-group')
    if (before instanceof HTMLElement && before.parentElement === form) {
      form.insertBefore(group, before)
    } else {
      form.prepend(group)
    }
  }
  for (const paragraph of form.querySelectorAll('p')) {
    if (!paragraph.textContent.includes('Signing in as')) continue
    if (!(paragraph instanceof HTMLElement)) continue
    paragraph.setAttribute(PARAGRAPH_HIDDEN, 'true')
    paragraph.hidden = true
  }
}

// A blank password is the original Continue step, so company sign-in still runs.
// The password stays out of the query string.
function bindBlankPasswordContinue(form: HTMLFormElement): void {
  if (submitGuards.has(form)) return
  const controller = new AbortController()
  submitGuards.set(form, controller)
  form.addEventListener(
    'submit',
    event => {
      const password = namedInput(form, 'password')
      if (password?.value !== '') return
      const email = namedInput(form, 'email')
      if (email === null) return
      event.preventDefault()
      const url = new URL(form.action)
      url.search = ''
      url.searchParams.set('email', email.value)
      location.assign(url.href)
    },
    { signal: controller.signal }
  )
}

function restore(form: HTMLFormElement): void {
  submitGuards.get(form)?.abort()
  submitGuards.delete(form)
  restoreHiddenEmail(form)
  restoreAutocomplete(namedInput(form, 'email'))
  restoreAutocomplete(namedInput(form, 'password'))
  for (const node of form.querySelectorAll(`[${ADDED}]`)) node.remove()
  restoreSubmit(form)
  restoreMethod(form)
  for (const paragraph of form.querySelectorAll(`[${PARAGRAPH_HIDDEN}]`)) {
    if (!(paragraph instanceof HTMLElement)) continue
    paragraph.hidden = false
    paragraph.removeAttribute(PARAGRAPH_HIDDEN)
  }
  form.removeAttribute(MARK)
}

function restoreHiddenEmail(form: HTMLFormElement): void {
  const email = namedInput(form, 'email')
  if (email?.getAttribute(EMAIL_WAS_HIDDEN) !== 'true') return
  email.type = 'hidden'
  email.classList.remove('form-control', 'input-lg')
  email.required = false
  email.removeAttribute(EMAIL_WAS_HIDDEN)
  const token = namedInput(form, '_token')
  if (token !== null) {
    token.insertAdjacentElement('afterend', email)
  } else {
    form.prepend(email)
  }
}

function restoreAutocomplete(input: HTMLInputElement | null): void {
  if (!input?.hasAttribute(AUTOCOMPLETE_WAS)) return
  const previous = input.getAttribute(AUTOCOMPLETE_WAS) ?? ''
  if (previous === '') {
    input.removeAttribute('autocomplete')
  } else {
    input.setAttribute('autocomplete', previous)
  }
  input.removeAttribute(AUTOCOMPLETE_WAS)
}

function restoreSubmit(form: HTMLFormElement): void {
  const submit = submitControl(form)
  if (!submit?.hasAttribute(SUBMIT_WAS)) return
  submit.value = submit.getAttribute(SUBMIT_WAS) ?? 'Continue'
  submit.removeAttribute(SUBMIT_WAS)
}

function restoreMethod(form: HTMLFormElement): void {
  const method = form.getAttribute(METHOD_WAS)
  if (method === 'get' || method === 'post') form.method = method
  form.removeAttribute(METHOD_WAS)
}

function setAutocomplete(input: HTMLInputElement, value: 'username' | 'current-password'): void {
  if (!input.hasAttribute(AUTOCOMPLETE_WAS)) {
    input.setAttribute(AUTOCOMPLETE_WAS, input.getAttribute('autocomplete') ?? '')
  }
  input.autocomplete = value
}

function submitControl(form: HTMLFormElement): HTMLInputElement | null {
  const control = form.querySelector('input[type="submit"]')
  return control instanceof HTMLInputElement ? control : null
}

function namedInput(form: HTMLFormElement, name: string): HTMLInputElement | null {
  const input = form.querySelector(`input[name="${name}"]`)
  return input instanceof HTMLInputElement ? input : null
}

function csrfToken(): string | null {
  const meta = document.querySelector('meta[name="csrf_token"]')
  if (!(meta instanceof HTMLMetaElement) || meta.content === '') return null
  return meta.content
}

function signInForm(): HTMLFormElement | null {
  if (!isSignInPage()) return null
  for (const form of document.querySelectorAll('form')) {
    if (!(form instanceof HTMLFormElement)) continue
    if (!isSignInAction(form)) continue
    if (namedInput(form, 'email') === null) continue
    return form
  }
  return null
}

function isSignInAction(form: HTMLFormElement): boolean {
  return new URL(form.action).pathname.replace(/\/+$/, '').toLowerCase() === '/signin'
}

function isSignInPage(): boolean {
  return location.pathname.replace(/\/+$/, '').toLowerCase() === '/signin'
}
