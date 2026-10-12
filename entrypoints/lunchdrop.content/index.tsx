import { createRoot } from 'react-dom/client'
import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root'
import {
  defaultSupportPolicy,
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
import { defaultHideTooltips, parseHideTooltips } from '../../lib/hide-tooltips'
import { HIDE_TOOLTIPS_STORAGE_KEY, readHideTooltips } from '../../lib/hide-tooltips-storage'
import { defaultStickyDatePicker, parseStickyDatePicker } from '../../lib/sticky-date-picker'
import {
  readStickyDatePicker,
  STICKY_DATE_PICKER_STORAGE_KEY,
} from '../../lib/sticky-date-picker-storage'
import { defaultCombinedSignIn, parseCombinedSignIn } from '../../lib/combined-sign-in'
import {
  COMBINED_SIGN_IN_STORAGE_KEY,
  readCombinedSignIn,
} from '../../lib/combined-sign-in-storage'
import {
  defaultCollapsePickupInstructions,
  parseCollapsePickupInstructions,
} from '../../lib/collapse-pickup-instructions'
import {
  defaultSimplifiedOrderSummary,
  parseSimplifiedOrderSummary,
} from '../../lib/simplified-order-summary'
import {
  readSimplifiedOrderSummary,
  SIMPLIFIED_ORDER_SUMMARY_STORAGE_KEY,
} from '../../lib/simplified-order-summary-storage'
import {
  COLLAPSE_PICKUP_INSTRUCTIONS_STORAGE_KEY,
  readCollapsePickupInstructions,
} from '../../lib/collapse-pickup-instructions-storage'
import { defaultExtensionEnabled, parseExtensionEnabled } from '../../lib/extension-enabled'
import {
  EXTENSION_ENABLED_STORAGE_KEY,
  readExtensionEnabled,
} from '../../lib/extension-enabled-storage'
import { browser } from 'wxt/browser'
import PageApp from './App'
import { removeEvenRestaurantCards, syncEvenRestaurantCards } from './even-restaurant-cards'
import { removeHideNewBadges, syncHideNewBadges } from './new-badges'
import { removeHideTooltips, syncHideTooltips } from './hide-tooltips'
import { removeStickyDatePicker, syncStickyDatePicker } from './sticky-date-picker'
import { removeCombinedSignIn, syncCombinedSignIn } from './combined-sign-in'
import {
  removeCollapsePickupInstructions,
  syncCollapsePickupInstructions,
} from './pickup-instructions'
import { removeRestaurantTileDetails, syncRestaurantTileDetails } from './restaurant-tile-details'
import {
  ensureOrderSummaryStyles,
  removeOrderSummaryStyles,
  syncOrderSummary,
} from './order-summary'
import { removeOrderFooter, syncOrderFooter } from './order-footer'
import { ensurePromptStyles, removePromptStyles, syncMiscPrompts } from './page-prompts'
import {
  injectSupportRow,
  refreshSupportOverrideMarks,
  removeSupportRow,
  startSupportOverrideMarks,
} from './support-row'
import { removeWrapLongDescriptions, syncWrapLongDescriptions } from './wrap-descriptions'
import './style.css'

const loadedStorageKeys = new Set<string>()

function storageLoaded(key: string): boolean {
  return loadedStorageKeys.has(key)
}

function watchStored<T>(
  storageKey: string,
  parse: (value: unknown) => T,
  read: () => Promise<T>,
  apply: (value: T) => void
): void {
  const remember = (value: T): void => {
    loadedStorageKeys.add(storageKey)
    apply(value)
  }
  browser.storage.onChanged.addListener(changes => {
    const change = changes[storageKey]
    if (change === undefined) return
    remember(parse(change.newValue))
  })
  void read().then(remember)
}

interface MountedPageUi {
  mount: () => void
  remove: () => void
}

export default defineContentScript({
  matches: ['*://*.lunchdrop.com/*', '*://lunchdrop.com/*'],
  cssInjectionMode: 'ui',
  runAt: 'document_start',
  async main(ctx) {
    let policy: SupportPolicy = { mode: 'default', percent: 10 }
    let enabled = defaultExtensionEnabled()
    let hidePrompts: HidePagePrompts = defaultHidePagePrompts()
    let hideOrderSummary: HideOrderSummary = defaultHideOrderSummary()
    let wrapLongDescriptions = defaultWrapLongDescriptions()
    let evenRestaurantCards = defaultEvenRestaurantCards()
    let restaurantTileDetails: RestaurantTileDetails = defaultRestaurantTileDetails()
    let hideNewBadges = defaultHideNewBadges()
    let hideTooltips = defaultHideTooltips()
    let stickyDatePicker = defaultStickyDatePicker()
    let combinedSignIn = defaultCombinedSignIn()
    let collapsePickupInstructions = defaultCollapsePickupInstructions()
    let simplifiedOrderSummary = defaultSimplifiedOrderSummary()
    let observer: MutationObserver | null = null
    let stopOverrideMarks: (() => void) | null = null
    let pageStarted = false
    let pageUi: MountedPageUi | null = null

    function pageActive(): boolean {
      return storageLoaded(EXTENSION_ENABLED_STORAGE_KEY) && enabled
    }

    function publishActivePolicy(): void {
      if (!storageLoaded(EXTENSION_ENABLED_STORAGE_KEY)) return
      if (!enabled) {
        publishSupportPolicy(defaultSupportPolicy())
        return
      }
      if (!storageLoaded(SUPPORT_POLICY_STORAGE_KEY)) return
      publishSupportPolicy(policy)
    }

    function applySimplifiedOrder(): void {
      if (!pageActive()) return
      if (
        storageLoaded(SIMPLIFIED_ORDER_SUMMARY_STORAGE_KEY) &&
        storageLoaded(HIDE_ORDER_SUMMARY_STORAGE_KEY)
      ) {
        ensureOrderSummaryStyles()
        syncOrderSummary(
          simplifiedOrderSummary ? hideOrderSummary : { mode: 'show-all', hidden: [] }
        )
      }
      if (storageLoaded(SIMPLIFIED_ORDER_SUMMARY_STORAGE_KEY)) {
        syncOrderFooter(simplifiedOrderSummary)
      }
      if (
        storageLoaded(SIMPLIFIED_ORDER_SUMMARY_STORAGE_KEY) &&
        storageLoaded(COLLAPSE_PICKUP_INSTRUCTIONS_STORAGE_KEY)
      ) {
        syncCollapsePickupInstructions(simplifiedOrderSummary && collapsePickupInstructions)
      }
    }

    function syncEarlyFeatures(): void {
      if (!pageActive()) return
      if (storageLoaded(COMBINED_SIGN_IN_STORAGE_KEY)) syncCombinedSignIn(combinedSignIn)
      if (storageLoaded(RESTAURANT_TILE_DETAILS_STORAGE_KEY)) {
        syncRestaurantTileDetails(restaurantTileDetails)
      }
      if (storageLoaded(HIDE_NEW_BADGES_STORAGE_KEY)) syncHideNewBadges(hideNewBadges)
      if (storageLoaded(STICKY_DATE_PICKER_STORAGE_KEY)) syncStickyDatePicker(stickyDatePicker)
      if (storageLoaded(HIDE_PAGE_PROMPTS_STORAGE_KEY)) {
        ensurePromptStyles()
        syncMiscPrompts(hidePrompts)
      }
      applySimplifiedOrder()
    }

    function syncStableFeatures(): void {
      if (!pageActive() || document.readyState === 'loading') return
      if (storageLoaded(WRAP_LONG_DESCRIPTIONS_STORAGE_KEY)) {
        syncWrapLongDescriptions(wrapLongDescriptions)
      }
      if (storageLoaded(EVEN_RESTAURANT_CARDS_STORAGE_KEY)) {
        syncEvenRestaurantCards(evenRestaurantCards)
      }
      if (storageLoaded(HIDE_TOOLTIPS_STORAGE_KEY)) syncHideTooltips(hideTooltips)
    }

    function syncObserved(): void {
      if (!pageActive() || !pageStarted) return
      observer?.disconnect()
      ensurePromptStyles()
      ensureOrderSummaryStyles()
      injectSupportRow()
      if (storageLoaded(HIDE_PAGE_PROMPTS_STORAGE_KEY)) syncMiscPrompts(hidePrompts)
      if (storageLoaded(RESTAURANT_TILE_DETAILS_STORAGE_KEY)) {
        syncRestaurantTileDetails(restaurantTileDetails)
      }
      if (storageLoaded(HIDE_NEW_BADGES_STORAGE_KEY)) syncHideNewBadges(hideNewBadges)
      if (storageLoaded(STICKY_DATE_PICKER_STORAGE_KEY)) syncStickyDatePicker(stickyDatePicker)
      if (storageLoaded(COMBINED_SIGN_IN_STORAGE_KEY)) syncCombinedSignIn(combinedSignIn)
      applySimplifiedOrder()
      refreshSupportOverrideMarks()
      if (!pageActive() || observer === null) return
      observer.observe(document.body, { childList: true, subtree: true })
    }

    function startPage(): void {
      if (pageUi === null || !pageActive() || document.readyState === 'loading') return
      if (!pageStarted) {
        pageStarted = true
        pageUi.mount()
        stopOverrideMarks = startSupportOverrideMarks()
        observer = new MutationObserver(() => {
          syncObserved()
        })
      }
      syncStableFeatures()
      syncObserved()
    }

    function stopPage(): void {
      observer?.disconnect()
      observer = null
      stopOverrideMarks?.()
      stopOverrideMarks = null
      if (pageStarted) {
        pageStarted = false
        pageUi?.remove()
      }
      removeSupportRow()
      removePromptStyles()
      removeOrderSummaryStyles()
      removeWrapLongDescriptions()
      removeEvenRestaurantCards()
      removeRestaurantTileDetails()
      removeHideNewBadges()
      removeHideTooltips()
      removeStickyDatePicker()
      removeCombinedSignIn()
      removeCollapsePickupInstructions()
      removeOrderFooter()
    }

    function applyEnabledState(): void {
      publishActivePolicy()
      if (!storageLoaded(EXTENSION_ENABLED_STORAGE_KEY)) return
      if (!enabled) {
        stopPage()
        return
      }
      syncStableFeatures()
      if (document.readyState === 'loading' || pageUi === null) {
        syncEarlyFeatures()
        return
      }
      startPage()
    }

    window.addEventListener('message', event => {
      if (event.source !== window) return
      if (isPolicyRequestMessage(event.data)) publishActivePolicy()
      const origin = supportOriginFromMessage(event.data)
      if (origin === null) return
      void rememberSupportOrigin(origin.orderId, origin.supportFee, origin.replace).then(() => {
        if (!pageActive()) return
        refreshSupportOverrideMarks()
      })
    })

    watchStored(SUPPORT_POLICY_STORAGE_KEY, parseSupportPolicy, readSupportPolicy, next => {
      policy = next
      publishActivePolicy()
    })
    watchStored(
      EXTENSION_ENABLED_STORAGE_KEY,
      parseExtensionEnabled,
      readExtensionEnabled,
      value => {
        enabled = value
        applyEnabledState()
      }
    )
    watchStored(COMBINED_SIGN_IN_STORAGE_KEY, parseCombinedSignIn, readCombinedSignIn, value => {
      combinedSignIn = value
      if (!pageActive()) return
      syncCombinedSignIn(combinedSignIn)
    })

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

    watchStored(HIDE_PAGE_PROMPTS_STORAGE_KEY, parseHidePagePrompts, readHidePagePrompts, value => {
      hidePrompts = value
      if (!pageActive()) return
      ensurePromptStyles()
      syncMiscPrompts(hidePrompts)
    })

    watchStored(
      HIDE_ORDER_SUMMARY_STORAGE_KEY,
      parseHideOrderSummary,
      readHideOrderSummary,
      value => {
        hideOrderSummary = value
        applySimplifiedOrder()
      }
    )

    watchStored(
      WRAP_LONG_DESCRIPTIONS_STORAGE_KEY,
      parseWrapLongDescriptions,
      readWrapLongDescriptions,
      value => {
        wrapLongDescriptions = value
        if (!pageActive() || document.readyState === 'loading') return
        syncWrapLongDescriptions(wrapLongDescriptions)
      }
    )

    watchStored(
      EVEN_RESTAURANT_CARDS_STORAGE_KEY,
      parseEvenRestaurantCards,
      readEvenRestaurantCards,
      value => {
        evenRestaurantCards = value
        if (!pageActive() || document.readyState === 'loading') return
        syncEvenRestaurantCards(evenRestaurantCards)
      }
    )

    watchStored(
      RESTAURANT_TILE_DETAILS_STORAGE_KEY,
      parseRestaurantTileDetails,
      readRestaurantTileDetails,
      value => {
        restaurantTileDetails = value
        if (!pageActive()) return
        syncRestaurantTileDetails(restaurantTileDetails)
      }
    )

    watchStored(HIDE_NEW_BADGES_STORAGE_KEY, parseHideNewBadges, readHideNewBadges, value => {
      hideNewBadges = value
      if (!pageActive()) return
      syncHideNewBadges(hideNewBadges)
    })

    watchStored(HIDE_TOOLTIPS_STORAGE_KEY, parseHideTooltips, readHideTooltips, value => {
      hideTooltips = value
      if (!pageActive() || document.readyState === 'loading') return
      syncHideTooltips(hideTooltips)
    })

    watchStored(
      STICKY_DATE_PICKER_STORAGE_KEY,
      parseStickyDatePicker,
      readStickyDatePicker,
      value => {
        stickyDatePicker = value
        if (!pageActive()) return
        syncStickyDatePicker(stickyDatePicker)
      }
    )

    watchStored(
      COLLAPSE_PICKUP_INSTRUCTIONS_STORAGE_KEY,
      parseCollapsePickupInstructions,
      readCollapsePickupInstructions,
      value => {
        collapsePickupInstructions = value
        applySimplifiedOrder()
      }
    )

    watchStored(
      SIMPLIFIED_ORDER_SUMMARY_STORAGE_KEY,
      parseSimplifiedOrderSummary,
      readSimplifiedOrderSummary,
      value => {
        simplifiedOrderSummary = value
        applySimplifiedOrder()
      }
    )

    if (document.readyState === 'loading') {
      document.addEventListener(
        'DOMContentLoaded',
        () => {
          applyEnabledState()
        },
        { once: true }
      )
    }

    pageUi = {
      mount: () => {
        ui.mount()
      },
      remove: () => {
        ui.remove()
      },
    }
    applyEnabledState()

    ctx.onInvalidated(() => {
      stopPage()
    })
  },
})
