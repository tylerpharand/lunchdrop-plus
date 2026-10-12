import { useEffect, useState } from 'react'
import { browser } from 'wxt/browser'
import {
  defaultRestaurantTileDetails,
  parseRestaurantTileDetails,
  type RestaurantTileDetails,
} from '../lib/restaurant-tile-details'
import {
  readRestaurantTileDetails,
  RESTAURANT_TILE_DETAILS_STORAGE_KEY,
  writeRestaurantTileDetails,
} from '../lib/restaurant-tile-details-storage'

export function useRestaurantTileDetails(): {
  details: RestaurantTileDetails
  setDetails: (details: RestaurantTileDetails) => void
} {
  const [details, setDetailsState] = useState(defaultRestaurantTileDetails)

  useEffect(() => {
    void readRestaurantTileDetails().then(setDetailsState)

    const onStorageChanged = (changes: Record<string, { newValue?: unknown }>): void => {
      const change = changes[RESTAURANT_TILE_DETAILS_STORAGE_KEY]
      if (change === undefined) return
      setDetailsState(parseRestaurantTileDetails(change.newValue))
    }
    browser.storage.onChanged.addListener(onStorageChanged)
    return () => {
      browser.storage.onChanged.removeListener(onStorageChanged)
    }
  }, [])

  const setDetails = (next: RestaurantTileDetails): void => {
    setDetailsState(next)
    void writeRestaurantTileDetails(next)
  }

  return { details, setDetails }
}
