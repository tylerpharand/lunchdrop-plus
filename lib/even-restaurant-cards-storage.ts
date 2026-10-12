import { browser } from 'wxt/browser'
import { parseEvenRestaurantCards } from './even-restaurant-cards'

export const EVEN_RESTAURANT_CARDS_STORAGE_KEY = 'evenRestaurantCards'

export async function readEvenRestaurantCards(): Promise<boolean> {
  const stored = await browser.storage.local.get(EVEN_RESTAURANT_CARDS_STORAGE_KEY)
  return parseEvenRestaurantCards(stored[EVEN_RESTAURANT_CARDS_STORAGE_KEY])
}

export async function writeEvenRestaurantCards(enabled: boolean): Promise<void> {
  await browser.storage.local.set({ [EVEN_RESTAURANT_CARDS_STORAGE_KEY]: enabled })
}
