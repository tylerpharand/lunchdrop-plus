import { useRef, useState, type KeyboardEvent, type ReactElement } from 'react'
import { browser } from 'wxt/browser'
import { EvenRestaurantCardsSetting } from '../../components/EvenRestaurantCardsSetting'
import { HideOrderSummarySetting } from '../../components/HideOrderSummarySetting'
import { HidePromptsSetting } from '../../components/HidePromptsSetting'
import { SupportPreference } from '../../components/SupportPreference'
import { WrapDescriptionsSetting } from '../../components/WrapDescriptionsSetting'
import { useEvenRestaurantCards } from '../../components/use-even-restaurant-cards'
import { useHideOrderSummary } from '../../components/use-hide-order-summary'
import { useHidePagePrompts } from '../../components/use-hide-page-prompts'
import { useSupportPolicy } from '../../components/use-support-policy'
import { useWrapLongDescriptions } from '../../components/use-wrap-long-descriptions'

const extensionVersion = browser.runtime.getManifest().version

const TABS = [
  { id: 'support', label: 'Support' },
  { id: 'ui', label: 'UI' },
] as const

type PopupTab = (typeof TABS)[number]['id']

export default function App(): ReactElement {
  const { policy, setPolicy } = useSupportPolicy()
  const { preference, setPreference } = useHidePagePrompts()
  const { preference: orderSummary, setPreference: setOrderSummary } = useHideOrderSummary()
  const { wrapLongDescriptions, setWrapLongDescriptions } = useWrapLongDescriptions()
  const { evenRestaurantCards, setEvenRestaurantCards } = useEvenRestaurantCards()
  const [tab, setTab] = useState<PopupTab>('support')
  const tabRefs = useRef(new Map<PopupTab, HTMLButtonElement>())

  const selectTab = (next: PopupTab, focus = false): void => {
    setTab(next)
    if (focus) tabRefs.current.get(next)?.focus()
  }

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, current: PopupTab): void => {
    const index = TABS.findIndex(item => item.id === current)
    if (index < 0) return
    let nextIndex = index
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % TABS.length
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + TABS.length) % TABS.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = TABS.length - 1
    else return
    event.preventDefault()
    const next = TABS[nextIndex]
    if (next === undefined) return
    selectTab(next.id, true)
  }

  return (
    <main className="bg-white p-4 font-sans text-zinc-900 antialiased">
      <header className="flex items-center justify-between">
        <h1 className="text-base font-bold tracking-tight text-[#009900]">
          Lunchdrop+ <span className="font-normal text-zinc-400">({extensionVersion})</span>
        </h1>
        <a
          href="https://github.com/tylerpharand/lunchdrop-plus"
          target="_blank"
          rel="noreferrer"
          aria-label="Lunchdrop+ on GitHub"
          className="rounded-md p-1 text-zinc-400 hover:text-zinc-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#009900]"
        >
          <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4 fill-current">
            <path d="M8 0c-4.42 0-8 3.58-8 8 0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.7 7.7 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8" />
          </svg>
        </a>
      </header>
      <div
        role="tablist"
        aria-label="Settings"
        aria-orientation="horizontal"
        className="mt-4 grid grid-cols-2 border-b border-zinc-200"
      >
        {TABS.map(item => {
          const selected = item.id === tab
          return (
            <button
              key={item.id}
              ref={node => {
                if (node) tabRefs.current.set(item.id, node)
                else tabRefs.current.delete(item.id)
              }}
              type="button"
              role="tab"
              id={`popup-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`popup-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => {
                selectTab(item.id)
              }}
              onKeyDown={event => {
                onTabKeyDown(event, item.id)
              }}
              className={`-mb-px cursor-pointer border-b-2 pb-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#009900] ${
                selected
                  ? 'border-[#009900] text-zinc-900'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </div>
      <div
        role="tabpanel"
        id={`popup-panel-${tab}`}
        aria-labelledby={`popup-tab-${tab}`}
        className="mt-4"
      >
        {tab === 'support' ? (
          <>
            <p className="mb-3 text-sm leading-5 text-zinc-600">
              Saved for the next order you place.
            </p>
            <SupportPreference policy={policy} quote={null} onChange={setPolicy} />
          </>
        ) : null}
        {tab === 'ui' ? (
          <>
            <HidePromptsSetting preference={preference} onChange={setPreference} />
            <HideOrderSummarySetting preference={orderSummary} onChange={setOrderSummary} />
            <WrapDescriptionsSetting
              enabled={wrapLongDescriptions}
              onChange={setWrapLongDescriptions}
            />
            <EvenRestaurantCardsSetting
              enabled={evenRestaurantCards}
              onChange={setEvenRestaurantCards}
            />
          </>
        ) : null}
      </div>
    </main>
  )
}
