import { createRoot } from 'react-dom/client'
import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root'
import {
  isPolicyRequestMessage,
  parseSupportPolicy,
  supportOriginFromMessage,
  type SupportPolicy,
} from '../../lib/support-policy'
import {
  publishSupportPolicy,
  readSupportPolicy,
  rememberSupportOrigin,
  SUPPORT_POLICY_STORAGE_KEY,
} from '../../lib/support-policy-storage'
import {
  defaultHidePagePrompts,
  parseHidePagePrompts,
  type HidePagePrompts,
} from '../../lib/page-prompts'
import { HIDE_PAGE_PROMPTS_STORAGE_KEY, readHidePagePrompts } from '../../lib/page-prompts-storage'
import { bindVisualFrame } from '../../lib/visual-viewport'
import { defaultWrapLongDescriptions, parseWrapLongDescriptions } from '../../lib/wrap-descriptions'
import {
  readWrapLongDescriptions,
  WRAP_LONG_DESCRIPTIONS_STORAGE_KEY,
} from '../../lib/wrap-descriptions-storage'
import { browser } from 'wxt/browser'
import PageApp from './App'
import { ensurePromptStyles, removePromptStyles, syncMiscPrompts } from './page-prompts'
import { injectSupportRow, removeSupportRow } from './support-row'
import { removeWrapLongDescriptions, syncWrapLongDescriptions } from './wrap-descriptions'
import './style.css'

export default defineContentScript({
  matches: ['*://*.lunchdrop.com/*', '*://lunchdrop.com/*'],
  cssInjectionMode: 'ui',
  runAt: 'document_start',
  async main(ctx) {
    let policy: SupportPolicy = { mode: 'default', percent: 10 }
    let hidePrompts: HidePagePrompts = defaultHidePagePrompts()
    let wrapLongDescriptions = defaultWrapLongDescriptions()
    let observer: MutationObserver | null = null

    window.addEventListener('message', event => {
      if (event.source !== window) return
      if (isPolicyRequestMessage(event.data)) publishSupportPolicy(policy)
      const origin = supportOriginFromMessage(event.data)
      if (origin === null) return
      void rememberSupportOrigin(origin.orderId, origin.supportFee, origin.replace)
    })

    const publishStored = (next: SupportPolicy): void => {
      policy = next
      publishSupportPolicy(next)
    }
    void readSupportPolicy().then(publishStored)

    const ui = await createShadowRootUi(ctx, {
      name: 'lunchdrop-plus-support',
      position: 'modal',
      zIndex: 2147483646,
      isolateEvents: true,
      // :host { all: initial !important } would drop the stacking context.
      css: ':host { position: relative !important; z-index: 2147483646 !important; width: 0 !important; height: 0 !important; }',
      onMount(container) {
        container.style.pointerEvents = 'none'
        const stopFrame = bindVisualFrame(container)
        const root = createRoot(container)
        root.render(
          <PageApp
            onOpenChange={open => {
              container.style.pointerEvents = open ? 'auto' : 'none'
            }}
          />
        )
        return { root, stopFrame }
      },
      onRemove(mounted) {
        mounted?.stopFrame()
        mounted?.root.unmount()
      },
    })

    browser.storage.onChanged.addListener(changes => {
      const policyChange = changes[SUPPORT_POLICY_STORAGE_KEY]
      if (policyChange !== undefined) {
        policy = parseSupportPolicy(policyChange.newValue)
        publishSupportPolicy(policy)
      }
      const promptChange = changes[HIDE_PAGE_PROMPTS_STORAGE_KEY]
      if (promptChange !== undefined) {
        hidePrompts = parseHidePagePrompts(promptChange.newValue)
        syncMiscPrompts(hidePrompts)
      }
      const wrapChange = changes[WRAP_LONG_DESCRIPTIONS_STORAGE_KEY]
      if (wrapChange === undefined) return
      wrapLongDescriptions = parseWrapLongDescriptions(wrapChange.newValue)
      if (document.readyState === 'loading') return
      syncWrapLongDescriptions(wrapLongDescriptions)
    })

    void readHidePagePrompts().then(value => {
      hidePrompts = value
      syncMiscPrompts(hidePrompts)
    })

    void readWrapLongDescriptions().then(value => {
      wrapLongDescriptions = value
      if (document.readyState === 'loading') return
      syncWrapLongDescriptions(wrapLongDescriptions)
    })

    const start = (): void => {
      ensurePromptStyles()
      syncWrapLongDescriptions(wrapLongDescriptions)
      injectSupportRow()
      syncMiscPrompts(hidePrompts)
      ui.mount()
      const syncPage = (): void => {
        observer?.disconnect()
        injectSupportRow()
        syncMiscPrompts(hidePrompts)
        observer?.observe(document.body, { childList: true, subtree: true })
      }
      observer = new MutationObserver(syncPage)
      syncPage()
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start, { once: true })
    } else {
      start()
    }

    ctx.onInvalidated(() => {
      observer?.disconnect()
      removeSupportRow()
      removePromptStyles()
      removeWrapLongDescriptions()
    })
  },
})
