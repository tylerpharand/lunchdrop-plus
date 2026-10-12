import { defaultEvenRestaurantCards, parseEvenRestaurantCards } from '../lib/even-restaurant-cards'
import {
  EVEN_RESTAURANT_CARDS_STORAGE_KEY,
  readEvenRestaurantCards,
  writeEvenRestaurantCards,
} from '../lib/even-restaurant-cards-storage'
import { useStoredValue } from './use-stored-value'

export function useEvenRestaurantCards(): {
  evenRestaurantCards: boolean
  setEvenRestaurantCards: (enabled: boolean) => void
} {
  const { value: evenRestaurantCards, setValue: setEvenRestaurantCards } = useStoredValue({
    initial: defaultEvenRestaurantCards(),
    storageKey: EVEN_RESTAURANT_CARDS_STORAGE_KEY,
    read: readEvenRestaurantCards,
    write: writeEvenRestaurantCards,
    parse: parseEvenRestaurantCards,
  })

  return { evenRestaurantCards, setEvenRestaurantCards }
}
