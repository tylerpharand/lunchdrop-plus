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
import {
  defaultHideOrderSummary,
  parseHideOrderSummary,
  type HideOrderSummary,
} from '../../lib/order-summary'
import {
  HIDE_ORDER_SUMMARY_STORAGE_KEY,
  readHideOrderSummary,
} from '../../lib/order-summary-storage'
import { bindVisualFrame } from '../../lib/visual-viewport'
import { defaultWrapLongDescriptions, parseWrapLongDescriptions } from '../../lib/wrap-descriptions'
import {
  readWrapLongDescriptions,
  WRAP_LONG_DESCRIPTIONS_STORAGE_KEY,
} from '../../lib/wrap-descriptions-storage'
import {
  defaultEvenRestaurantCards,
  parseEvenRestaurantCards,
} from '../../lib/even-restaurant-cards'
import {
  EVEN_RESTAURANT_CARDS_STORAGE_KEY,
  readEvenRestaurantCards,
} from '../../lib/even-restaurant-cards-storage'
import {
  defaultRestaurantTileDetails,
  parseRestaurantTileDetails,
  type RestaurantTileDetails,
} from '../../lib/restaurant-tile-details'
import {
  readRestaurantTileDetails,
  RESTAURANT_TILE_DETAILS_STORAGE_KEY,
} from '../../lib/restaurant-tile-details-storage'
import { defaultHideNewBadges, parseHideNewBadges } from '../../lib/new-badges'
import { HIDE_NEW_BADGES_STORAGE_KEY, readHideNewBadges } from '../../lib/new-badges-storage'
import { browser } from 'wxt/browser'
import PageApp from './App'
import { removeEvenRestaurantCards, syncEvenRestaurantCards } from './even-restaurant-cards'
import { removeHideNewBadges, syncHideNewBadges } from './new-badges'
import { removeRestaurantTileDetails, syncRestaurantTileDetails } from './restaurant-tile-details'
import {
  ensureOrderSummaryStyles,
  removeOrderSummaryStyles,
  syncOrderSummary,
} from './order-summary'
import { ensurePromptStyles, removePromptStyles, syncMiscPrompts } from './page-prompts'
import {
  injectSupportRow,
  refreshSupportOverrideMarks,
  removeSupportRow,
  startSupportOverrideMarks,
} from './support-row'
import { removeWrapLongDescriptions, syncWrapLongDescriptions } from './wrap-descriptions'
import './style.css'

export default defineContentScript({
  matches: ['*://*.lunchdrop.com/*', '*://lunchdrop.com/*'],
  cssInjectionMode: 'ui',
  runAt: 'document_start',
  async main(ctx) {
    let policy: SupportPolicy = { mode: 'default', percent: 10 }
    let hidePrompts: HidePagePrompts = defaultHidePagePrompts()
    let hideOrderSummary: HideOrderSummary = defaultHideOrderSummary()
    let wrapLongDescriptions = defaultWrapLongDescriptions()
    let evenRestaurantCards = defaultEvenRestaurantCards()
    let restaurantTileDetails: RestaurantTileDetails = defaultRestaurantTileDetails()
    let hideNewBadges = defaultHideNewBadges()
    let observer: MutationObserver | null = null
    const stopOverrideMarks = startSupportOverrideMarks()

    window.addEventListener('message', event => {
      if (event.source !== window) return
      if (isPolicyRequestMessage(event.data)) publishSupportPolicy(policy)
      const origin = supportOriginFromMessage(event.data)
      if (origin === null) return
      void rememberSupportOrigin(origin.orderId, origin.supportFee, origin.replace).then(() => {
        refreshSupportOverrideMarks()
      })
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
      const orderSummaryChange = changes[HIDE_ORDER_SUMMARY_STORAGE_KEY]
      if (orderSummaryChange !== undefined) {
        hideOrderSummary = parseHideOrderSummary(orderSummaryChange.newValue)
        syncOrderSummary(hideOrderSummary)
      }
      const wrapChange = changes[WRAP_LONG_DESCRIPTIONS_STORAGE_KEY]
      if (wrapChange !== undefined) {
        wrapLongDescriptions = parseWrapLongDescriptions(wrapChange.newValue)
        if (document.readyState !== 'loading') syncWrapLongDescriptions(wrapLongDescriptions)
      }
      const evenChange = changes[EVEN_RESTAURANT_CARDS_STORAGE_KEY]
      if (evenChange !== undefined) {
        evenRestaurantCards = parseEvenRestaurantCards(evenChange.newValue)
        if (document.readyState !== 'loading') syncEvenRestaurantCards(evenRestaurantCards)
      }
      const tileChange = changes[RESTAURANT_TILE_DETAILS_STORAGE_KEY]
      if (tileChange !== undefined) {
        restaurantTileDetails = parseRestaurantTileDetails(tileChange.newValue)
        syncRestaurantTileDetails(restaurantTileDetails)
      }
      const newBadgeChange = changes[HIDE_NEW_BADGES_STORAGE_KEY]
      if (newBadgeChange !== undefined) {
        hideNewBadges = parseHideNewBadges(newBadgeChange.newValue)
        syncHideNewBadges(hideNewBadges)
      }
    })

    void readHidePagePrompts().then(value => {
      hidePrompts = value
      syncMiscPrompts(hidePrompts)
    })

    void readHideOrderSummary().then(value => {
      hideOrderSummary = value
      syncOrderSummary(hideOrderSummary)
    })

    void readWrapLongDescriptions().then(value => {
      wrapLongDescriptions = value
      if (document.readyState === 'loading') return
      syncWrapLongDescriptions(wrapLongDescriptions)
    })

    void readEvenRestaurantCards().then(value => {
      evenRestaurantCards = value
      if (document.readyState === 'loading') return
      syncEvenRestaurantCards(evenRestaurantCards)
    })

    void readRestaurantTileDetails().then(value => {
      restaurantTileDetails = value
      syncRestaurantTileDetails(restaurantTileDetails)
    })

    void readHideNewBadges().then(value => {
      hideNewBadges = value
      syncHideNewBadges(hideNewBadges)
    })

    const start = (): void => {
      ensurePromptStyles()
      ensureOrderSummaryStyles()
      syncWrapLongDescriptions(wrapLongDescriptions)
      syncEvenRestaurantCards(evenRestaurantCards)
      syncRestaurantTileDetails(restaurantTileDetails)
      syncHideNewBadges(hideNewBadges)
      injectSupportRow()
      syncMiscPrompts(hidePrompts)
      syncOrderSummary(hideOrderSummary)
      ui.mount()
      const syncPage = (): void => {
        observer?.disconnect()
        injectSupportRow()
        syncMiscPrompts(hidePrompts)
        syncOrderSummary(hideOrderSummary)
        syncRestaurantTileDetails(restaurantTileDetails)
        syncHideNewBadges(hideNewBadges)
        refreshSupportOverrideMarks()
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
      stopOverrideMarks()
      removeSupportRow()
      removePromptStyles()
      removeOrderSummaryStyles()
      removeWrapLongDescriptions()
      removeEvenRestaurantCards()
      removeRestaurantTileDetails()
      removeHideNewBadges()
    })
  },
})
