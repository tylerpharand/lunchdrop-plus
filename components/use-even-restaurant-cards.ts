import { useEffect, useState } from 'react'
import { browser } from 'wxt/browser'
import { defaultEvenRestaurantCards, parseEvenRestaurantCards } from '../lib/even-restaurant-cards'
import {
  EVEN_RESTAURANT_CARDS_STORAGE_KEY,
  readEvenRestaurantCards,
  writeEvenRestaurantCards,
} from '../lib/even-restaurant-cards-storage'

export function useEvenRestaurantCards(): {
  evenRestaurantCards: boolean
  setEvenRestaurantCards: (enabled: boolean) => void
} {
  const [evenRestaurantCards, setEvenRestaurantCardsState] = useState(defaultEvenRestaurantCards)

  useEffect(() => {
    void readEvenRestaurantCards().then(setEvenRestaurantCardsState)

    const onStorageChanged = (changes: Record<string, { newValue?: unknown }>): void => {
      const change = changes[EVEN_RESTAURANT_CARDS_STORAGE_KEY]
      if (change === undefined) return
      setEvenRestaurantCardsState(parseEvenRestaurantCards(change.newValue))
    }
    browser.storage.onChanged.addListener(onStorageChanged)
    return () => {
      browser.storage.onChanged.removeListener(onStorageChanged)
    }
  }, [])

  const setEvenRestaurantCards = (enabled: boolean): void => {
    setEvenRestaurantCardsState(enabled)
    void writeEvenRestaurantCards(enabled)
  }

  return { evenRestaurantCards, setEvenRestaurantCards }
}
