import { browser } from 'wxt/browser'
import { parseRestaurantTileDetails, type RestaurantTileDetails } from './restaurant-tile-details'

export const RESTAURANT_TILE_DETAILS_STORAGE_KEY = 'restaurantTileDetails'

export async function readRestaurantTileDetails(): Promise<RestaurantTileDetails> {
  const stored = await browser.storage.local.get(RESTAURANT_TILE_DETAILS_STORAGE_KEY)
  return parseRestaurantTileDetails(stored[RESTAURANT_TILE_DETAILS_STORAGE_KEY])
}

export async function writeRestaurantTileDetails(details: RestaurantTileDetails): Promise<void> {
  await browser.storage.local.set({ [RESTAURANT_TILE_DETAILS_STORAGE_KEY]: details })
}
