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
import { useStoredValue } from './use-stored-value'

export function useRestaurantTileDetails(): {
  details: RestaurantTileDetails
  setDetails: (details: RestaurantTileDetails) => void
} {
  const { value: details, setValue: setDetails } = useStoredValue({
    initial: defaultRestaurantTileDetails(),
    storageKey: RESTAURANT_TILE_DETAILS_STORAGE_KEY,
    read: readRestaurantTileDetails,
    write: writeRestaurantTileDetails,
    parse: parseRestaurantTileDetails,
  })

  return { details, setDetails }
}
